package com.bv87.diemdanh.controller;

import com.bv87.diemdanh.dto.BrandingDto;
import com.bv87.diemdanh.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.concurrent.TimeUnit;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final SettingsService settingsService;

    @GetMapping("/branding")
    public ResponseEntity<BrandingDto> getBranding() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(5, TimeUnit.MINUTES).cachePublic())
                .body(settingsService.getBranding());
    }
}
