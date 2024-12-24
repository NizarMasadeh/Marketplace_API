const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const axios = require('axios');
const UAParser = require('ua-parser-js');

/**
 * Get detailed IP information from ip-api.com
 * @param {string} ip - The IP address to look up
 * @returns {Promise<Object>} - The location data
 */
const getDetailedIpInfo = async (ip) => {
    try {
        if (ip === '::1' || ip === '127.0.0.1') {
            ip = '176.28.159.76';
        }
        
        const response = await axios.get(`http://ip-api.com/json/${ip}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching IP details:', error);
        return null;
    }
};

/**
 * Parse and normalize user agent data
 * @param {string} userAgent - The user agent string
 * @returns {Object} - Normalized browser, OS, and device info
 */
const parseUserAgent = (userAgent) => {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    console.log("User agent: ", result);
    
    return {
        browser: {
            name: result.browser.name || 'Unknown',
            version: result.browser.version || 'Unknown'
        },
        os: {
            name: result.os.name || 'Unknown',
            version: result.os.version || 'Unknown'
        },
        device: {
            type: result.device.type || 'desktop',
            vendor: result.device.vendor || 'Unknown',
            model: result.device.model || 'Unknown'
        }
    };
};

/**
 * Get client's real IP address
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIp = (req) => {
    console.log("Req: ", req);
    
    const ipAddress = req.headers['x-forwarded-for']?.split(',').shift() || 
                     req.socket?.remoteAddress ||
                     req.ip;
                     
    return ipAddress === '::1' ? '176.28.159.76' : ipAddress; // Use default IP for localhost
};

/**
 * Track user visit
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const trackUserVisit = async (req, res) => {
    try {
        const clientIp = getClientIp(req);
        const userAgent = req.headers['user-agent'];
        
        const ipInfo = await getDetailedIpInfo(clientIp);
        
        const userAgentInfo = parseUserAgent(userAgent);
        
        const userData = {
            ip: clientIp,
            visit_timestamp: new Date().toISOString(),
            country: ipInfo?.country || 'Unknown',
            city: ipInfo?.city || 'Unknown',
            region: ipInfo?.regionName || 'Unknown',
            timezone: ipInfo?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            latitude: req.body.latitude || ipInfo?.lat || 0,
            longitude: req.body.longitude || ipInfo?.lon || 0,
            browser: userAgentInfo.browser,
            device: userAgentInfo.device,
            os: userAgentInfo.os,
            isp: ipInfo?.isp || 'Unknown'
        };

        if (req.body.accuracy) {
            userData.browser.locationAccuracy = req.body.accuracy;
        }

        const { data, error } = await supabase
            .from('ip_stuff')
            .insert([userData]);

        if (error) {
            throw new Error(`Supabase insertion error: ${error.message}`);
        }

        res.status(200).json({
            success: true,
            message: 'User visit tracked successfully',
            data: userData
        });

    } catch (error) {
        console.error('Error tracking user visit:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to track user visit',
            details: error.message
        });
    }
};

/**
 * Get all tracked users with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTrackedUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const { data: totalCount } = await supabase
            .from('ip_stuff')
            .select('count');

        const { data, error } = await supabase
            .from('ip_stuff')
            .select('*')
            .order('visit_timestamp', { ascending: false })
            .range(startIndex, startIndex + limit - 1);

        if (error) throw error;

        res.status(200).json({
            success: true,
            data,
            pagination: {
                page,
                limit,
                total: totalCount[0]?.count || 0,
                pages: Math.ceil((totalCount[0]?.count || 0) / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching tracked users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tracked users',
            details: error.message
        });
    }
};

/**
 * Get analytics for a specific time period
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = supabase
            .from('ip_stuff')
            .select('*');
            
        if (startDate && endDate) {
            query = query
                .gte('visit_timestamp', startDate)
                .lte('visit_timestamp', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        const analytics = {
            totalVisits: data.length,
            uniqueVisitors: new Set(data.map(user => user.ip)).size,
            countryDistribution: data.reduce((acc, user) => {
                acc[user.country] = (acc[user.country] || 0) + 1;
                return acc;
            }, {}),
            browserDistribution: data.reduce((acc, user) => {
                acc[user.browser.name] = (acc[user.browser.name] || 0) + 1;
                return acc;
            }, {}),
            deviceTypes: data.reduce((acc, user) => {
                acc[user.device.type] = (acc[user.device.type] || 0) + 1;
                return acc;
            }, {})
        };

        res.status(200).json({
            success: true,
            data: analytics,
            timeframe: {
                start: startDate || 'all time',
                end: endDate || 'present'
            }
        });

    } catch (error) {
        console.error('Error generating analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate analytics',
            details: error.message
        });
    }
};

module.exports = {
    getAnalytics,
    getTrackedUsers,
    trackUserVisit
};