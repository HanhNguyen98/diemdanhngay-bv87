package com.bv87.diemdanh.service.ai;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class AiNlpParser {

    private static final Pattern DMY_SLASH = Pattern.compile("(\\d{1,2})[/.-](\\d{1,2})(?:[/.-](\\d{2,4}))?");
    private static final DateTimeFormatter DMY = DateTimeFormatter.ofPattern("d/M/uuuu");

    public LocalDate parseDate(String message, LocalDate defaultDate) {
        if (message == null || message.isBlank()) {
            return defaultDate;
        }
        String q = message.toLowerCase(Locale.ROOT);
        if (containsAny(q, "hôm nay", "hom nay", "sáng nay", "sang nay", "hôm nay")) {
            return defaultDate;
        }

        Matcher matcher = DMY_SLASH.matcher(message);
        if (matcher.find()) {
            int day = Integer.parseInt(matcher.group(1));
            int month = Integer.parseInt(matcher.group(2));
            int year = matcher.group(3) != null
                    ? normalizeYear(Integer.parseInt(matcher.group(3)))
                    : defaultDate.getYear();
            try {
                return LocalDate.of(year, month, day);
            } catch (RuntimeException ignored) {
                try {
                    return LocalDate.parse(day + "/" + month + "/" + year, DMY);
                } catch (DateTimeParseException ex) {
                    return defaultDate;
                }
            }
        }
        return defaultDate;
    }

    public boolean hasExplicitDate(String message) {
        if (message == null) {
            return false;
        }
        String q = message.toLowerCase(Locale.ROOT);
        if (containsAny(q, "hôm nay", "hom nay", "sáng nay", "sang nay")) {
            return true;
        }
        return DMY_SLASH.matcher(message).find();
    }

    public LocalDate[] parseDateRange(String message, LocalDate today) {
        LocalDate date = parseDate(message, today);
        return new LocalDate[] { date, date };
    }

    private int normalizeYear(int year) {
        if (year < 100) {
            return 2000 + year;
        }
        return year;
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }
}
