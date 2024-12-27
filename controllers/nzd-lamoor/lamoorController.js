const supabase = require('../../config/supabase');

let io;

const setLamoorSocket = (socketInstance) => {
    io = socketInstance;
};

const getMessages = async (req, res) => {
    try {
        const { page = 1, limit = 20, sender_id, receiver_id, message, reactions } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('lamoor')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1);

        // Add filters if provided
        if (sender_id) query = query.eq('sender_id', sender_id);
        if (receiver_id) query = query.eq('receiver_id', receiver_id);

        const { data: messages, count, error } = await query;

        if (error) throw error;

        res.json({
            pagination: {
                total: count,
                pages: Math.ceil(count / limit),
                current: parseInt(page),
                limit: parseInt(limit),
            },
            messages,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createMessage = async (req, res) => {
    try {
        const { sender_id, receiver_id, message, reactions } = req.body;

        // Validate required fields
        if (!sender_id || !receiver_id || !message) {
            return res.status(400).json({
                error: 'sender_id, receiver_id, and message are required fields'
            });
        }

        const messageData = {
            sender_id,
            receiver_id,
            message,
            reactions: reactions || [],
            created_at: new Date().toISOString()
        };

        const { data: newMessage, error: messageError } = await supabase
            .from('lamoor')
            .insert([messageData])
            .select()
            .single();

        if (messageError) throw messageError;

        // Emit socket event if socket.io is configured
        if (io) {
            io.emit('lamoorMessage', newMessage)
        }

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, reactions } = req.body;

        const { data: updatedMessage, error } = await supabase
            .from('lamoor')
            .update({
                message,
                reactions,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!updatedMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json(updatedMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: deletedMessage, error } = await supabase
            .from('lamoor')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!deletedMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getConversation = async (req, res) => {
    try {
        const { user1_id, user2_id, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        if (!user1_id || !user2_id) {
            return res.status(400).json({
                error: 'Both user1_id and user2_id are required'
            });
        }

        const { data: messages, count, error } = await supabase
            .from('lamoor')
            .select('*', { count: 'exact' })
            .or(`and(sender_id.eq.${user1_id},receiver_id.eq.${user2_id}),and(sender_id.eq.${user2_id},receiver_id.eq.${user1_id})`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            pagination: {
                total: count,
                pages: Math.ceil(count / limit),
                current: parseInt(page),
                limit: parseInt(limit),
            },
            messages,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    setLamoorSocket,
    getMessages,
    createMessage,
    updateMessage,
    deleteMessage,
    getConversation
};