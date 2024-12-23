const supabase = require('../config/supabase');

const insertUserData = async (req, res) => {
    try {
        const {
            status, country, countryCode, region, regionName, city, zip,
            lat, lon, timezone, isp, org, as, query, ip, type,
            continent, continent_code, userAgentString, device,
            engine, operatingSystem, ...customFields
        } = req.body;

        const userDataObj = {
            status,
            country,
            country_code: countryCode,
            region,
            region_name: regionName,
            city,
            zip,
            lat,
            lon,
            timezone_id: timezone.id,
            timezone_abbr: timezone.abbr,
            timezone_is_dst: timezone.is_dst,
            timezone_offset: timezone.offset,
            timezone_utc: timezone.utc,
            isp,
            org,
            as_info: as,
            query_ip: query,
            ip,
            type,
            continent,
            continent_code,
            user_agent_string: userAgentString,
            device_name: device.name,
            device_type: device.type,
            device_brand: device.brand,
            device_cpu: device.cpu,
            engine_name: engine.name,
            engine_type: engine.type,
            engine_version: engine.version,
            os_name: operatingSystem.name,
            os_type: operatingSystem.type,
            os_version: operatingSystem.version
        };

        const { data, error } = await supabase
            .from('nzrm-users')
            .insert([userDataObj])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating user data:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    insertUserData
};