package com.bv87.diemdanh.service;

import com.bv87.diemdanh.config.AppOpsProperties;
import com.bv87.diemdanh.dto.ServerStorageDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

/**
 * Reads host-written {@code disk-status.json}. Never inspects the container filesystem.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServerStorageService {

    static final double WARNING_FREE_PERCENT = 20.0;
    static final double DANGER_FREE_PERCENT = 10.0;
    private static final double BYTES_PER_GB = 1024d * 1024d * 1024d;

    private final AppOpsProperties opsProperties;
    private final ObjectMapper objectMapper;

    /**
     * @return storage banner payload; {@code ok} with null message when the file is missing or invalid
     */
    public ServerStorageDto getStorage() {
        Path path = resolvePath();
        if (path == null) {
            return okEmpty();
        }
        try {
            if (!Files.isRegularFile(path)) {
                log.debug("Disk status file missing: {}", path);
                return okEmpty();
            }
            byte[] raw = Files.readAllBytes(path);
            DiskStatusFile file = objectMapper.readValue(raw, DiskStatusFile.class);
            if (file == null || file.getFreePercent() == null) {
                return okEmpty();
            }
            return classify(file);
        } catch (Exception ex) {
            log.debug("Disk status unreadable: {}", ex.toString());
            return okEmpty();
        }
    }

    private Path resolvePath() {
        String configured = opsProperties.getDiskStatusPath();
        if (configured == null || configured.isBlank()) {
            return null;
        }
        return Path.of(configured.trim());
    }

    private ServerStorageDto classify(DiskStatusFile file) {
        double freePercent = file.getFreePercent();
        String drive = (file.getDrive() == null || file.getDrive().isBlank()) ? "C:" : file.getDrive().trim();
        String level = "ok";
        String message = null;
        if (freePercent < DANGER_FREE_PERCENT) {
            level = "danger";
            message = formatMessage(drive, file, "90", true);
        } else if (freePercent < WARNING_FREE_PERCENT) {
            level = "warning";
            message = formatMessage(drive, file, "80", false);
        }
        return ServerStorageDto.builder()
                .level(level)
                .message(message)
                .drive(drive)
                .freePercent(freePercent)
                .freeBytes(file.getFreeBytes())
                .usedBytes(file.getUsedBytes())
                .totalBytes(file.getTotalBytes())
                .checkedAt(file.getCheckedAt())
                .build();
    }

    private static String formatMessage(String drive, DiskStatusFile file, String usedThreshold, boolean urgent) {
        String freeGb = formatGb(file.getFreeBytes());
        String freePct = String.format(Locale.US, "%.1f", file.getFreePercent());
        String action = urgent
                ? "Xóa backup cũ hoặc dọn Docker ngay."
                : "Xóa backup cũ hoặc dọn Docker.";
        return String.format(
                Locale.US,
                "Ổ máy chủ %s còn %s GB (%s%%). Đã dùng hơn %s%%. %s",
                drive,
                freeGb,
                freePct,
                usedThreshold,
                action);
    }

    private static String formatGb(Long freeBytes) {
        if (freeBytes == null || freeBytes < 0) {
            return "0.0";
        }
        return String.format(Locale.US, "%.1f", freeBytes / BYTES_PER_GB);
    }

    private static ServerStorageDto okEmpty() {
        return ServerStorageDto.builder()
                .level("ok")
                .message(null)
                .build();
    }

    @Getter
    @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class DiskStatusFile {
        private String checkedAt;
        private String drive;
        private Long totalBytes;
        private Long freeBytes;
        private Long usedBytes;
        private Double freePercent;
    }
}
