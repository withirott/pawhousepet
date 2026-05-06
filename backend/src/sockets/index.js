const socketIo = require('socket.io');
const pool = require('../config/db');

module.exports = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ["GET", "POST"]
        }
    });

    // Make io accessible globally in express app
    // Actually we will just handle events here for now.
    
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // User joins their personal room for notifications
        socket.on('join_user_room', (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                console.log(`Socket ${socket.id} joined room user_${userId}`);
            }
        });

        // Chat message handler
        socket.on('send_message', async (data) => {
            try {
                const { chatId, senderId, receiverId, content } = data;
                
                // Save message to DB
                const [result] = await pool.query(
                    'INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)',
                    [chatId, senderId, content]
                );

                const messageData = {
                    id: result.insertId,
                    chat_id: chatId,
                    sender_id: senderId,
                    content,
                    created_at: new Date(),
                    is_read: 0
                };

                // Emit to receiver's room
                io.to(`user_${receiverId}`).emit('receive_message', messageData);
                // Emit back to sender (for confirmation)
                io.to(`user_${senderId}`).emit('receive_message', messageData);

                // Create Notification for the receiver
                await pool.query(
                    'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
                    [receiverId, 'chat', 'คุณมีข้อความใหม่ยังไม่ได้อ่าน']
                );
                
                // Emit notification pulse
                io.to(`user_${receiverId}`).emit('new_notification');

            } catch (err) {
                console.error("Socket send_message error:", err);
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { receiverId, chatId } = data;
            io.to(`user_${receiverId}`).emit('user_typing', { chatId });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};
