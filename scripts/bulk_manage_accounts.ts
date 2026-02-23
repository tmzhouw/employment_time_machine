import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    console.log('Fetching all companies...');
    const { data: companies, error: compErr } = await supabaseAdmin.from('companies').select('id, name, contact_phone');
    if (compErr || !companies) return console.error('Failed to fetch companies:', compErr);

    console.log('Fetching all existing enterprise accounts...');
    const { data: users, error: userErr } = await supabaseAdmin.from('auth_users').select('*').eq('role', 'ENTERPRISE');
    if (userErr || !users) return console.error('Failed to fetch users:', userErr);

    const userMap = new Map(users.map(u => [u.company_id, u]));
    const usedUsernames = new Set(users.map(u => u.username));

    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    let updatedCount = 0;
    let createdCount = 0;
    let fallbackCount = 0;
    let skippedCount = 0;

    for (const company of companies) {
        const existingUser = userMap.get(company.id);
        const rawPhone = company.contact_phone ? String(company.contact_phone).trim() : '';
        let targetUsername = rawPhone;

        // Fallback if no phone
        if (!targetUsername || targetUsername.length < 3) {
            targetUsername = `hr_${company.id.substring(0, 6)}`;
            fallbackCount++;
        }

        if (existingUser) {
            // Need to update? 
            if (existingUser.username.startsWith('hr_') || existingUser.username === 'testenterprise') {
                // Determine if we can update safely
                if (usedUsernames.has(targetUsername) && targetUsername !== existingUser.username) {
                    console.log(`⚠️ Skip updating ${company.name}: Username ${targetUsername} already taken.`);
                    skippedCount++;
                } else {
                    const { error } = await supabaseAdmin.from('auth_users')
                        .update({ username: targetUsername })
                        .eq('id', existingUser.id);

                    if (error) {
                        console.error(`❌ Error updating ${company.name}:`, error.message);
                    } else {
                        usedUsernames.delete(existingUser.username);
                        usedUsernames.add(targetUsername);
                        updatedCount++;
                        console.log(`✅ Updated: ${company.name} (${existingUser.username} -> ${targetUsername})`);
                    }
                }
            } else {
                skippedCount++; // Already looks like a good account
            }
        } else {
            // Need to create
            let finalUsername = targetUsername;
            let counter = 1;
            // Ensure unique
            while (usedUsernames.has(finalUsername)) {
                finalUsername = `${targetUsername}_${counter}`;
                counter++;
            }

            const { error } = await supabaseAdmin.from('auth_users').insert({
                company_id: company.id,
                username: finalUsername,
                password_hash: defaultPasswordHash,
                role: 'ENTERPRISE'
            });

            if (error) {
                console.error(`❌ Error creating for ${company.name}:`, error.message);
            } else {
                usedUsernames.add(finalUsername);
                createdCount++;
                console.log(`✨ Created: ${company.name} -> Username: ${finalUsername}`);
            }
        }
    }

    console.log('\\n=== DONE ===');
    console.log(`Updated legacy accounts: ${updatedCount}`);
    console.log(`Newly created accounts: ${createdCount}`);
    console.log(`Had to use hr_ fallback (no phone): ${fallbackCount}`);
    console.log(`Skipped (already fine or error): ${skippedCount}`);
}

main().catch(console.error);
