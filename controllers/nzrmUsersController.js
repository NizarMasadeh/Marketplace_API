const supabase = require('../config/supabase');

const insertUserData = async (req, res) => {
    try {
        const {
            status, country, countryCode, region, regionName, city, zip,
            lat, lon, timezone, isp, org, as, query, ip, success, type,
            continent, continentCode, regionCode, latitude, longitude,
            is_eu, postal, calling_code, capital, borders, flag,
            connection, userAgentString, name, version, versionMajor, build,
            device, engine, operatingSystem
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
            timezone, // JSONB
            isp,
            org,
            as_info: as, // Renamed to match SQL column name
            query,
            ip,
            success,
            type,
            continent,
            continent_code: continentCode,
            region_code: regionCode,
            latitude,
            longitude,
            is_eu,
            postal,
            calling_code,
            capital,
            borders,
            flag, // JSONB
            connection, // JSONB
            user_agent_string: userAgentString,
            name,
            version,
            version_major: versionMajor,
            build,
            device, // JSONB
            engine, // JSONB
            operating_system: operatingSystem // JSONB
        };

        const { data, error } = await supabase
            .from('nzrm_users')
            .insert([userDataObj])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating user data:', error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    insertUserData
};
