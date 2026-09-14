package com.bv87.diemdanh.service;

import com.bv87.diemdanh.config.AppOpsProperties;
import com.bv87.diemdanh.dto.ServerStorageDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** D-DISK.1 — host JSON thresholds; missing/invalid file must not raise a false alarm. */
class ServerStorageServiceTest {

    @TempDir
    Path tempDir;

    private AppOpsProperties properties;
    private ServerStorageService service;

    @BeforeEach
    void setUp() {
        properties = new AppOpsProperties();
        service = new ServerStorageService(properties, new ObjectMapper());
    }

    @Test
    void missingFileIsOk() {
        properties.setDiskStatusPath(tempDir.resolve("missing.json").toString());
        ServerStorageDto dto = service.getStorage();
        assertEquals("ok", dto.getLevel());
        assertNull(dto.getMessage());
    }

    @Test
    void blankPathIsOk() {
        properties.setDiskStatusPath("  ");
        ServerStorageDto dto = service.getStorage();
        assertEquals("ok", dto.getLevel());
        assertNull(dto.getMessage());
    }

    @Test
    void invalidJsonIsOk() throws Exception {
        Path file = tempDir.resolve("disk-status.json");
        Files.writeString(file, "{not-json", StandardCharsets.UTF_8);
        properties.setDiskStatusPath(file.toString());
        ServerStorageDto dto = service.getStorage();
        assertEquals("ok", dto.getLevel());
        assertNull(dto.getMessage());
    }

    @Test
    void healthyDiskHidesBanner() throws Exception {
        writeStatus(25.0, 50L * gb());
        ServerStorageDto dto = service.getStorage();
        assertEquals("ok", dto.getLevel());
        assertNull(dto.getMessage());
        assertEquals(25.0, dto.getFreePercent());
    }

    @Test
    void warningWhenFreeUnder20() throws Exception {
        writeStatus(15.0, 12L * gb() / 10);
        ServerStorageDto dto = service.getStorage();
        assertEquals("warning", dto.getLevel());
        assertTrue(dto.getMessage().contains("hơn 80%"));
        assertTrue(dto.getMessage().contains("C:"));
        assertTrue(dto.getMessage().contains("dọn Docker."));
    }

    @Test
    void dangerWhenFreeUnder10() throws Exception {
        writeStatus(8.2, 41L * gb() / 10);
        ServerStorageDto dto = service.getStorage();
        assertEquals("danger", dto.getLevel());
        assertTrue(dto.getMessage().contains("hơn 90%"));
        assertTrue(dto.getMessage().contains("ngay."));
    }

    @Test
    void boundary20IsOk() throws Exception {
        writeStatus(20.0, gb());
        assertEquals("ok", service.getStorage().getLevel());
        assertNull(service.getStorage().getMessage());
    }

    @Test
    void boundary10IsWarning() throws Exception {
        writeStatus(10.0, gb());
        assertEquals("warning", service.getStorage().getLevel());
    }

    private void writeStatus(double freePercent, long freeBytes) throws Exception {
        Path file = tempDir.resolve("disk-status.json");
        String json = """
                {"checkedAt":"2026-09-14T13:00:00","drive":"C:","totalBytes":100,"freeBytes":%d,"usedBytes":50,"freePercent":%s}
                """.formatted(freeBytes, freePercent);
        Files.writeString(file, json, StandardCharsets.UTF_8);
        properties.setDiskStatusPath(file.toString());
    }

    private static long gb() {
        return 1024L * 1024L * 1024L;
    }
}
