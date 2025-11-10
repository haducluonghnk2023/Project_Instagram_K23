package com.data.db_instagram.utils;

import java.util.Date;

/**
 * Date utility functions
 */
public final class DateUtils {
    
    private DateUtils() {
        // Utility class - prevent instantiation
    }
    
    /**
     * Check if date is within last 24 hours
     */
    public static boolean isWithin24Hours(Date date) {
        if (date == null) return false;
        Date now = new Date();
        long diffInMs = now.getTime() - date.getTime();
        return diffInMs >= 0 && diffInMs <= (24 * 60 * 60 * 1000L);
    }
    
    /**
     * Get current date
     */
    public static Date now() {
        return new Date();
    }
    
    /**
     * Get date 24 hours ago
     */
    public static Date twentyFourHoursAgo() {
        return new Date(System.currentTimeMillis() - (24 * 60 * 60 * 1000L));
    }
}

