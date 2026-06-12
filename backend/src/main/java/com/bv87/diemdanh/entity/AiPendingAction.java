package com.bv87.diemdanh.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Short-lived confirmation tokens for AI tool actions (e.g. batch reminders). */
@Entity
@Table(name = "ai_pending_actions")
@Getter
@Setter
@NoArgsConstructor
public class AiPendingAction {

    @Id
    @Column(name = "action_id", length = 36)
    private String actionId;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "dept_codes_json", nullable = false, columnDefinition = "TEXT")
    private String deptCodesJson;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
}
