package com.bv87.fingerprint.agent;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

/**
 * HTTP client for Spring Boot kiosk fingerprint APIs ({@code X-Kiosk-Token}).
 */
public class AppApiClient {

    private final String baseUrl;
    private final String kioskToken;

    public AppApiClient(String baseUrl, String kioskToken) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.kioskToken = kioskToken;
    }

    public static AppApiClient fromProperties(Path propertiesFile) throws IOException {
        Properties props = new Properties();
        if (Files.exists(propertiesFile)) {
            try (InputStream in = Files.newInputStream(propertiesFile)) {
                props.load(in);
            }
        } else {
            Path example = propertiesFile.resolveSibling("agent.properties.example");
            if (Files.exists(example)) {
                try (InputStream in = Files.newInputStream(example)) {
                    props.load(in);
                }
            }
        }
        String base = props.getProperty("api.baseUrl", "http://localhost:8082").trim();
        String token = props.getProperty("kiosk.token", "").trim();
        if (token.isEmpty()) {
            throw new IOException("Thiếu kiosk.token trong agent.properties");
        }
        return new AppApiClient(base, token);
    }

    public HealthInfo health() throws IOException {
        return parseHealth(get("/api/kiosk/health"));
    }

    public List<StaffItem> listStaff() throws IOException {
        return parseStaffList(get("/api/kiosk/staff"));
    }

    public void enroll(int empCode, String templateBase64, int templateLen, int zkFid, String fingerLabel)
            throws IOException {
        String body = "{"
                + "\"empCode\":" + empCode + ","
                + "\"templateBase64\":\"" + escapeJson(templateBase64) + "\","
                + "\"templateLen\":" + templateLen + ","
                + "\"fingerIndex\":0,"
                + "\"zkFid\":" + zkFid + ","
                + "\"fingerLabel\":\"" + escapeJson(fingerLabel) + "\""
                + "}";
        post("/api/kiosk/fingerprints/enroll", body);
    }

    /** Soft-delete active template for employee in kiosk department (P2.2). */
    public void deleteFingerprint(int empCode) throws IOException {
        delete("/api/kiosk/fingerprints/" + empCode);
    }

    /** Active templates for local Identify DB (P2.1). */
    public List<TemplateItem> listTemplates() throws IOException {
        return parseTemplateList(get("/api/kiosk/fingerprints/templates"));
    }

    /** Post Identify match result; server applies IN/OUT + rule C (P2.1). */
    public ScanResult scan(int empCode, int score) throws IOException {
        String body = "{\"empCode\":" + empCode + ",\"score\":" + score + "}";
        return parseScanResult(post("/api/kiosk/fingerprints/scan", body));
    }

    /** P4 §9.5.2 — Agent Online heartbeat. */
    public void heartbeat() throws IOException {
        post("/api/kiosk/heartbeat", "{}");
    }

    private String get(String path) throws IOException {
        HttpURLConnection conn = open(path, "GET");
        return readResponse(conn);
    }

    private String post(String path, String jsonBody) throws IOException {
        HttpURLConnection conn = open(path, "POST");
        conn.setDoOutput(true);
        conn.setRequestProperty("Content-Type", "application/json;charset=UTF-8");
        byte[] bytes = jsonBody.getBytes(StandardCharsets.UTF_8);
        conn.setFixedLengthStreamingMode(bytes.length);
        try (OutputStream out = conn.getOutputStream()) {
            out.write(bytes);
        }
        return readResponse(conn);
    }

    private String delete(String path) throws IOException {
        HttpURLConnection conn = open(path, "DELETE");
        return readResponse(conn);
    }

    private HttpURLConnection open(String path, String method) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) URI.create(baseUrl + path).toURL().openConnection();
        conn.setRequestMethod(method);
        // SPEC §9.3.3 P4b — short timeouts so UI worker does not hang long
        boolean scan = path != null && path.contains("/fingerprints/scan");
        conn.setConnectTimeout(5_000);
        conn.setReadTimeout(scan ? 8_000 : 15_000);
        conn.setRequestProperty("X-Kiosk-Token", kioskToken);
        conn.setRequestProperty("Accept", "application/json");
        return conn;
    }

    private static String readResponse(HttpURLConnection conn) throws IOException {
        try {
            int code = conn.getResponseCode();
            InputStream stream = code >= 400 ? conn.getErrorStream() : conn.getInputStream();
            String body = stream == null ? "" : new String(stream.readAllBytes(), StandardCharsets.UTF_8);
            if (stream != null) {
                stream.close();
            }
            if (code >= 400) {
                String message = extractJsonString(body, "message");
                throw new IOException(message.isEmpty() ? ("HTTP " + code) : message);
            }
            return body;
        } finally {
            conn.disconnect();
        }
    }

    private static HealthInfo parseHealth(String json) {
        Integer deptCode = extractJsonInt(json, "deptCode");
        String deptCodeFormatted = extractJsonString(json, "deptCodeFormatted");
        if (deptCodeFormatted.isEmpty() && deptCode != null) {
            deptCodeFormatted = String.format("%02d", deptCode);
        }
        String deptName = extractJsonString(json, "deptName");
        String label = extractJsonString(json, "label");
        return new HealthInfo(deptCode, deptCodeFormatted, deptName, label);
    }

    private static List<StaffItem> parseStaffList(String json) {
        List<StaffItem> list = new ArrayList<>();
        int pos = 0;
        while (true) {
            int empIdx = json.indexOf("\"empCode\"", pos);
            if (empIdx < 0) {
                break;
            }
            Integer empCodeObj = extractJsonIntFrom(json, empIdx);
            if (empCodeObj == null) {
                pos = empIdx + 8;
                continue;
            }
            int empCode = empCodeObj;
            String fullname = extractJsonStringAfter(json, "\"fullname\"", empIdx);
            boolean registered = false;
            int regKey = json.indexOf("\"fingerprintRegistered\"", empIdx);
            if (regKey >= 0) {
                int regColon = json.indexOf(':', regKey);
                int regEnd = json.indexOf(',', regColon);
                if (regEnd < 0) {
                    regEnd = json.indexOf('}', regColon);
                }
                if (regColon >= 0 && regEnd > regColon) {
                    registered = json.substring(regColon + 1, regEnd).trim().startsWith("t");
                }
            }
            String fingerLabel = extractJsonStringAfter(json, "\"fingerLabel\"", empIdx);
            if (fingerLabel == null || fingerLabel.isBlank()) {
                fingerLabel = null;
            }
            list.add(new StaffItem(empCode, fullname != null ? fullname : "", registered, fingerLabel));
            pos = empIdx + 8;
        }
        return list;
    }

    private static List<TemplateItem> parseTemplateList(String json) {
        List<TemplateItem> list = new ArrayList<>();
        if (json == null || json.isBlank() || json.trim().equals("[]")) {
            return list;
        }
        int pos = 0;
        while (true) {
            int empIdx = json.indexOf("\"empCode\"", pos);
            if (empIdx < 0) {
                break;
            }
            Integer empCode = extractJsonIntFrom(json, empIdx);
            String fullname = extractJsonStringAfter(json, "\"fullname\"", empIdx);
            String templateBase64 = extractJsonStringAfter(json, "\"templateBase64\"", empIdx);
            Integer templateLen = extractJsonIntKeyAfter(json, "templateLen", empIdx);
            if (empCode != null && templateBase64 != null && !templateBase64.isEmpty()) {
                // P2.1a: Identify FID is always empCode
                int fid = empCode;
                int len = templateLen != null ? templateLen : 0;
                list.add(new TemplateItem(empCode, fullname != null ? fullname : "", fid, templateBase64, len));
            }
            pos = empIdx + 8;
        }
        return list;
    }

    private static ScanResult parseScanResult(String json) {
        Integer empCode = extractJsonInt(json, "empCode");
        String empCodeFormatted = extractJsonString(json, "empCodeFormatted");
        String fullname = extractJsonString(json, "fullname");
        String direction = extractJsonString(json, "direction");
        String status = extractJsonString(json, "status");
        String message = extractJsonString(json, "message");
        Integer score = extractJsonInt(json, "score");
        return new ScanResult(
                empCode != null ? empCode : 0,
                empCodeFormatted,
                fullname,
                direction,
                status,
                message,
                score != null ? score : 0);
    }

    private static Integer extractJsonIntFrom(String json, int fromIdx) {
        int colon = json.indexOf(':', fromIdx);
        if (colon < 0) {
            return null;
        }
        int end = colon + 1;
        while (end < json.length() && Character.isWhitespace(json.charAt(end))) {
            end++;
        }
        int start = end;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) {
            end++;
        }
        if (start == end) {
            return null;
        }
        return Integer.parseInt(json.substring(start, end));
    }

    private static Integer extractJsonIntKeyAfter(String json, String key, int after) {
        int idx = json.indexOf("\"" + key + "\"", after);
        if (idx < 0) {
            return null;
        }
        return extractJsonIntFrom(json, idx);
    }

    private static String extractJsonStringAfter(String json, String quotedKey, int after) {
        int idx = json.indexOf(quotedKey, after);
        if (idx < 0) {
            return "";
        }
        int colon = json.indexOf(':', idx);
        if (colon < 0) {
            return "";
        }
        int i = colon + 1;
        while (i < json.length() && Character.isWhitespace(json.charAt(i))) {
            i++;
        }
        if (i < json.length() && json.startsWith("null", i)) {
            return "";
        }
        if (i >= json.length() || json.charAt(i) != '"') {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (int p = i + 1; p < json.length(); p++) {
            char c = json.charAt(p);
            if (c == '\\' && p + 1 < json.length()) {
                sb.append(json.charAt(p + 1));
                p++;
                continue;
            }
            if (c == '"') {
                break;
            }
            sb.append(c);
        }
        return sb.toString();
    }

    private static Integer extractJsonInt(String json, String key) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) {
            return null;
        }
        int colon = json.indexOf(':', idx);
        int end = colon + 1;
        while (end < json.length() && Character.isWhitespace(json.charAt(end))) {
            end++;
        }
        int start = end;
        while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) {
            end++;
        }
        if (start == end) {
            return null;
        }
        return Integer.parseInt(json.substring(start, end));
    }

    private static String extractJsonString(String json, String key) {
        int idx = json.indexOf("\"" + key + "\"");
        if (idx < 0) {
            return "";
        }
        int colon = json.indexOf(':', idx);
        if (colon < 0) {
            return "";
        }
        int i = colon + 1;
        while (i < json.length() && Character.isWhitespace(json.charAt(i))) {
            i++;
        }
        if (i < json.length() && json.startsWith("null", i)) {
            return "";
        }
        if (i >= json.length() || json.charAt(i) != '"') {
            return "";
        }
        int q1 = i;
        int q2 = json.indexOf('"', q1 + 1);
        if (q2 < 0) {
            return "";
        }
        return json.substring(q1 + 1, q2);
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    public record HealthInfo(
            Integer deptCode,
            String deptCodeFormatted,
            String deptName,
            String label
    ) {
        /** Display name for UI — never the word "kiosk". */
        public String departmentDisplay() {
            if (deptName != null && !deptName.isBlank()) {
                return deptName.trim();
            }
            if (deptCodeFormatted != null && !deptCodeFormatted.isBlank()) {
                return deptCodeFormatted;
            }
            return deptCode != null ? String.format("%02d", deptCode) : "—";
        }
    }

    public record StaffItem(int empCode, String fullname, boolean fingerprintRegistered, String fingerLabel) {
        @Override
        public String toString() {
            String code = String.format("%05d", empCode);
            if (!fingerprintRegistered) {
                return code + " — " + fullname + " [Chưa ĐK]";
            }
            if (fingerLabel != null && !fingerLabel.isBlank()) {
                return code + " — " + fullname + " [Đã ĐK — " + fingerLabel + "]";
            }
            return code + " — " + fullname + " [Đã ĐK]";
        }
    }

    /** One active template row for Identify cache. */
    public record TemplateItem(int empCode, String fullname, int zkFid, String templateBase64, int templateLen) {
    }

    /** Server response after POST /fingerprints/scan. */
    public record ScanResult(
            int empCode,
            String empCodeFormatted,
            String fullname,
            String direction,
            String status,
            String message,
            int score
    ) {
    }
}
