/**
 * Database Index Creation Script
 * Run this once to create optimized indexes for better query performance
 * 
 * Usage: node scripts/create-indexes.js
 */

import { connectToDatabase } from '../database/db.js';

async function createIndexes() {
    console.log('🔧 Creating database indexes...\n');

    try {
        const { db } = await connectToDatabase();

        // ==========================================
        // USERS COLLECTION INDEXES
        // ==========================================
        console.log('📦 Creating indexes for users collection...');

        // Index for finding monks
        await db.collection('users').createIndex(
            { role: 1 },
            { name: 'idx_users_role' }
        );

        // Index for special monks (admin designated)
        await db.collection('users').createIndex(
            { role: 1, isSpecial: -1 },
            { name: 'idx_users_role_isSpecial' }
        );

        // Index for clerk authentication
        await db.collection('users').createIndex(
            { clerkId: 1 },
            { unique: true, sparse: true, name: 'idx_users_clerkId' }
        );

        // Index for phone lookup
        await db.collection('users').createIndex(
            { phone: 1 },
            { sparse: true, name: 'idx_users_phone' }
        );

        // Index for role based monk status filtering
        await db.collection('users').createIndex(
            { role: 1, monkStatus: 1 },
            { name: 'idx_users_role_status' }
        );

        // Index for email lookup
        await db.collection('users').createIndex(
            { email: 1 },
            { sparse: true, name: 'idx_users_email' }
        );

        // Text search index for monks (name, title, bio)
        await db.collection('users').createIndex(
            { name: 'text', title: 'text', bio: 'text' },
            { name: 'idx_users_text_search' }
        );

        // Required indexes for fast Monk profile lookup
        await db.collection('users').createIndex(
            { role: 1, _id: 1 }, 
            { name: 'role_id_idx', background: true }
        );
        await db.collection('users').createIndex(
            { clerkId: 1, role: 1 }, 
            { name: 'clerkId_role_idx', background: true }
        );

        console.log('✅ Users indexes created\n');

        // ==========================================
        // BOOKINGS COLLECTION INDEXES
        // ==========================================
        console.log('📦 Creating indexes for bookings collection...');

        // Index for finding bookings by monk
        await db.collection('bookings').createIndex(
            { monkId: 1, date: 1, status: 1 },
            { name: 'idx_bookings_monk_date_status' }
        );

        // Optimized index for monk schedule/time verification
        await db.collection('bookings').createIndex(
            { monkId: 1, date: 1, time: 1 },
            { name: 'idx_bookings_monk_schedule' }
        );

        // Index for finding bookings by user
        await db.collection('bookings').createIndex(
            { clientId: 1, status: 1 },
            { name: 'idx_bookings_client_status' }
        );

        // Index for finding bookings by specific userId mapping
        await db.collection('bookings').createIndex(
            { userId: 1, status: 1 },
            { name: 'idx_bookings_user_status' }
        );

        // Index for email lookup
        await db.collection('bookings').createIndex(
            { userEmail: 1 },
            { sparse: true, name: 'idx_bookings_userEmail' }
        );

        // Index for phone lookup
        await db.collection('bookings').createIndex(
            { userPhone: 1 },
            { sparse: true, name: 'idx_bookings_userPhone' }
        );

        // Index for finding pending bookings
        await db.collection('bookings').createIndex(
            { status: 1, createdAt: -1 },
            { name: 'idx_bookings_status_created' }
        );

        // Index for cleanup queries (confirmed bookings by date/time)
        await db.collection('bookings').createIndex(
            { status: 1, date: 1, time: 1 },
            { name: 'idx_bookings_cleanup' }
        );

        // Required indexes for fast Booking lookup by entity
        await db.collection('bookings').createIndex(
            { userId: 1, status: 1 }, 
            { name: 'booking_user_idx', background: true }
        );
        await db.collection('bookings').createIndex(
            { monkId: 1, status: 1 }, 
            { name: 'booking_monk_idx', background: true }
        );

        console.log('✅ Bookings indexes created\n');

        // ==========================================
        // SERVICES COLLECTION INDEXES
        // ==========================================
        console.log('📦 Creating indexes for services collection...');

        // Index for active services
        await db.collection('services').createIndex(
            { active: 1 },
            { name: 'idx_services_active' }
        );

        console.log('✅ Services indexes created\n');

        // ==========================================
        // MESSAGES COLLECTION INDEXES (if applicable)
        // ==========================================
        console.log('📦 Creating indexes for messages collection...');

        // Index for finding messages by booking
        await db.collection('messages').createIndex(
            { bookingId: 1, createdAt: 1 },
            { name: 'idx_messages_booking_created' }
        );

        // ==========================================
        // DIRECT MESSAGES COLLECTION INDEXES
        // ==========================================
        console.log('📦 Creating indexes for direct_messages collection...');

        // Index for retrieving conversation history between two users
        await db.collection('direct_messages').createIndex(
            { senderId: 1, receiverId: 1, createdAt: -1 },
            { name: 'idx_dm_conversation' }
        );

        console.log('✅ Direct Messages indexes created\n');

        console.log('✅ Messages indexes created\n');

        // ==========================================
        // NOTIFICATIONS (GET /api/user/notifications)
        // ==========================================
        console.log('📦 Creating indexes for notifications collection...');
        await db.collection('notifications').createIndex(
            { userId: 1, createdAt: -1 },
            { name: 'idx_notifications_user_created' }
        );
        await db.collection('notifications').createIndex(
            { userId: 1, read: 1 },
            { name: 'idx_notifications_user_read' }
        );
        console.log('✅ Notifications indexes created\n');

        // ==========================================
        // BLOGS COLLECTION INDEXES
        // ==========================================
        console.log('📦 Creating indexes for blogs collection...');

        // Index for published blogs
        await db.collection('blogs').createIndex(
            { published: 1, createdAt: -1 },
            { name: 'idx_blogs_published_created' }
        );

        // Text search for blog content
        await db.collection('blogs').createIndex(
            { title: 'text', content: 'text' },
            { name: 'idx_blogs_text_search' }
        );

        console.log('✅ Blogs indexes created\n');

        // ==========================================
        // VERIFY INDEXES
        // ==========================================
        console.log('📊 Verifying indexes...\n');

        const collections = ['users', 'bookings', 'services', 'messages', 'direct_messages', 'notifications', 'blogs'];

        for (const collName of collections) {
            const indexes = await db.collection(collName).indexes();
            console.log(`${collName}:`, indexes.length, 'indexes');
        }

        console.log('\n✨ All indexes created successfully!');
        console.log('\n💡 Tip: Run db.collection("users").getIndexes() in MongoDB shell to verify');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating indexes:', error);
        process.exit(1);
    }
}

createIndexes();
