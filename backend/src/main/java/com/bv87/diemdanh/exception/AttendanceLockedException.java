package com.bv87.diemdanh.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a HEAD user attempts to edit attendance after the 16:00 cutoff
 * without an admin unlock. Message is Vietnamese (user-facing).
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class AttendanceLockedException extends RuntimeException {

    public AttendanceLockedException(String message) {
        super(message);
    }
}
