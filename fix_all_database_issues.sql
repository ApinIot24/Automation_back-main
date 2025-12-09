DO $$
DECLARE
    r RECORD;
    dup_id INTEGER;
    dup_count INTEGER;
    deleted_count INTEGER;
    max_id INTEGER;
    seq_name TEXT;
    table_seq_name TEXT;
    seq_exists BOOLEAN;
    result_text TEXT;
    table_owner TEXT;
    is_identity_column BOOLEAN;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '=== DATABASE FIX SCRIPT STARTED ===';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    RAISE NOTICE 'STEP 1: Checking for duplicate IDs...';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'automation' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'automation' 
            AND table_name = r.table_name 
            AND column_name = 'id'
        ) THEN
            BEGIN
                EXECUTE format('
                    SELECT COUNT(*) - COUNT(DISTINCT id) 
                    FROM automation.%I
                ', r.table_name) INTO dup_count;
                
                IF dup_count > 0 THEN
                    RAISE NOTICE '⚠️  Table: % has % duplicate IDs', r.table_name, dup_count;
                ELSE
                    RAISE NOTICE '✓  Table: % - No duplicate IDs', r.table_name;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '✗  Error checking table: % - %', r.table_name, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    
    RAISE NOTICE 'STEP 2: Fixing duplicate IDs...';
    RAISE NOTICE '';
    
    -- Fix counter_shift_l6
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'automation' AND table_name = 'counter_shift_l6') THEN
        RAISE NOTICE 'Fixing counter_shift_l6...';
        FOR dup_id IN 
            SELECT id 
            FROM automation.counter_shift_l6 
            GROUP BY id 
            HAVING COUNT(*) > 1
            ORDER BY id
        LOOP
            EXECUTE format('
                DELETE FROM automation.counter_shift_l6
                WHERE id = %s
                AND ctid NOT IN (
                    SELECT MIN(ctid) 
                    FROM automation.counter_shift_l6 
                    WHERE id = %s
                )
            ', dup_id, dup_id);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE '  Fixed duplicate ID % (deleted % rows)', dup_id, deleted_count;
        END LOOP;
    END IF;
    
    -- Fix counter_shift_l7
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'automation' AND table_name = 'counter_shift_l7') THEN
        RAISE NOTICE 'Fixing counter_shift_l7...';
        FOR dup_id IN 
            SELECT id 
            FROM automation.counter_shift_l7 
            GROUP BY id 
            HAVING COUNT(*) > 1
            ORDER BY id
        LOOP
            EXECUTE format('
                DELETE FROM automation.counter_shift_l7
                WHERE id = %s
                AND ctid NOT IN (
                    SELECT MIN(ctid) 
                    FROM automation.counter_shift_l7 
                    WHERE id = %s
                )
            ', dup_id, dup_id);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE '  Fixed duplicate ID % (deleted % rows)', dup_id, deleted_count;
        END LOOP;
    END IF;
    
    -- Fix packing_l6
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'automation' AND table_name = 'packing_l6') THEN
        RAISE NOTICE 'Fixing packing_l6...';
        FOR dup_id IN 
            SELECT id 
            FROM automation.packing_l6 
            GROUP BY id 
            HAVING COUNT(*) > 1
            ORDER BY id
        LOOP
            EXECUTE format('
                DELETE FROM automation.packing_l6
                WHERE id = %s
                AND ctid NOT IN (
                    SELECT MIN(ctid) 
                    FROM automation.packing_l6 
                    WHERE id = %s
                )
            ', dup_id, dup_id);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE '  Fixed duplicate ID % (deleted % rows)', dup_id, deleted_count;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    
    RAISE NOTICE 'STEP 3: Checking for foreign key violations...';
    RAISE NOTICE '';
    
    -- Check user_roles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'automation' AND table_name = 'user_roles') THEN
        EXECUTE format('SELECT COUNT(*) FROM automation.user_roles ur WHERE NOT EXISTS (SELECT 1 FROM automation.users u WHERE u.id = ur.user_id)') INTO dup_count;
        IF dup_count > 0 THEN
            RAISE NOTICE '⚠️  user_roles: % records with invalid user_id', dup_count;
        ELSE
            RAISE NOTICE '✓  user_roles: No invalid user_id';
        END IF;
        
        EXECUTE format('SELECT COUNT(*) FROM automation.user_roles ur WHERE NOT EXISTS (SELECT 1 FROM automation.roles r WHERE r.id = ur.role_id)') INTO dup_count;
        IF dup_count > 0 THEN
            RAISE NOTICE '⚠️  user_roles: % records with invalid role_id', dup_count;
        ELSE
            RAISE NOTICE '✓  user_roles: No invalid role_id';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    

    RAISE NOTICE 'STEP 4: Fixing foreign key violations...';
    RAISE NOTICE '';
    
    -- Fix user_roles: Delete records with invalid user_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'automation' AND table_name = 'user_roles') THEN
        DELETE FROM automation.user_roles
        WHERE NOT EXISTS (
            SELECT 1 FROM automation.users u WHERE u.id = user_roles.user_id
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  Deleted % records with invalid user_id', deleted_count;
        END IF;
        
        DELETE FROM automation.user_roles
        WHERE NOT EXISTS (
            SELECT 1 FROM automation.roles role WHERE role.id = user_roles.role_id
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  Deleted % records with invalid role_id', deleted_count;
        END IF;
    END IF;
    
    -- Fix role_permissions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'automation' AND table_name = 'role_permissions') THEN
        DELETE FROM automation.role_permissions
        WHERE NOT EXISTS (
            SELECT 1 FROM automation.roles role WHERE role.id = role_permissions.role_id
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  Deleted % records from role_permissions with invalid role_id', deleted_count;
        END IF;
        
        DELETE FROM automation.role_permissions
        WHERE NOT EXISTS (
            SELECT 1 FROM automation.permissions p WHERE p.id = role_permissions.permission_id
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  Deleted % records from role_permissions with invalid permission_id', deleted_count;
        END IF;
    END IF;
    
    -- Fix downtime
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'automation' AND table_name = 'downtime') THEN
        DELETE FROM automation.downtime
        WHERE id_lhp IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM automation.lhp l WHERE l.id = downtime.id_lhp
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  Deleted % records from downtime with invalid id_lhp', deleted_count;
        END IF;
    END IF;
    
    -- Fix downtime_l5
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'automation' AND table_name = 'downtime_l5') THEN
        DELETE FROM automation.downtime_l5
        WHERE id_lhp IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM automation.lhp_l5 l WHERE l.id = downtime_l5.id_lhp
        );
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '  Deleted % records from downtime_l5 with invalid id_lhp', deleted_count;
        END IF;
    END IF;
    
    RAISE NOTICE '';
    
    RAISE NOTICE 'STEP 5: Fixing existing sequences...';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'automation' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'automation' 
            AND table_name = r.table_name 
            AND column_name = 'id'
            AND is_nullable = 'NO'
        ) THEN
            BEGIN
                seq_name := 'automation.' || r.table_name || '_id_seq';
                table_seq_name := 'automation."' || r.table_name || '_id_seq"';
                EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM automation.%I', r.table_name) INTO max_id;
                
                BEGIN
                    EXECUTE format('SELECT setval(%L, %s, true)', seq_name, GREATEST(max_id, 1));
                    RAISE NOTICE '  Fixed sequence for table: % (max_id: %)', r.table_name, max_id;
                EXCEPTION WHEN OTHERS THEN
                    BEGIN
                        EXECUTE format('SELECT setval(%L, %s, true)', table_seq_name, GREATEST(max_id, 1));
                        RAISE NOTICE '  Fixed sequence for table: % (max_id: %)', r.table_name, max_id;
                    EXCEPTION WHEN OTHERS THEN
                        -- Sequence doesn't exist, will be created in next step
                        NULL;
                    END;
                END;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '  Error processing table: % - %', r.table_name, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
   
    RAISE NOTICE 'STEP 6: Creating missing sequences...';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT table_name
        FROM information_schema.tables t
        WHERE table_schema = 'automation' 
        AND table_type = 'BASE TABLE'
        AND EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'automation' 
            AND table_name = t.table_name 
            AND column_name = 'id'
        )
        ORDER BY table_name
    LOOP
        -- Check if the id column is an identity column
        EXECUTE format('
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = ''automation'' 
                AND table_name = %L 
                AND column_name = ''id''
                AND is_identity = ''YES''
            )
        ', r.table_name) INTO is_identity_column;
        
        -- Skip identity columns as they manage their own sequences
        IF is_identity_column THEN
            RAISE NOTICE '  Skipped table: % (id column is an identity column)', r.table_name;
            CONTINUE;
        END IF;
        
        seq_name := 'automation.' || r.table_name || '_id_seq';
        
        SELECT EXISTS (
            SELECT 1 
            FROM pg_sequences 
            WHERE schemaname = 'automation' 
            AND sequencename = r.table_name || '_id_seq'
        ) INTO seq_exists;
        
        IF NOT seq_exists THEN
            BEGIN
                EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM automation.%I', r.table_name) INTO max_id;
                
                -- Get table owner
                EXECUTE format('SELECT pg_get_userbyid(relowner) FROM pg_class WHERE relname = %L AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = ''automation'')', r.table_name) INTO table_owner;
                
                EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START WITH %s', seq_name, GREATEST(max_id + 1, 1));
                
                -- Verify sequence was created before trying to modify it
                SELECT EXISTS (
                    SELECT 1 
                    FROM pg_sequences 
                    WHERE schemaname = 'automation' 
                    AND sequencename = r.table_name || '_id_seq'
                ) INTO seq_exists;
                
                IF seq_exists THEN
                    -- Set sequence owner to match table owner before setting OWNED BY
                    IF table_owner IS NOT NULL THEN
                        EXECUTE format('ALTER SEQUENCE %I OWNER TO %I', seq_name, table_owner);
                    END IF;
                    
                    EXECUTE format('ALTER SEQUENCE %I OWNED BY automation.%I.id', seq_name, r.table_name);
                    EXECUTE format('ALTER TABLE automation.%I ALTER COLUMN id SET DEFAULT nextval(%L)', r.table_name, seq_name);
                    
                    RAISE NOTICE '  Created sequence for table: % (starting at %)', r.table_name, GREATEST(max_id + 1, 1);
                ELSE
                    RAISE NOTICE '  Warning: Sequence % was not created for table: %', seq_name, r.table_name;
                END IF;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '  Error creating sequence for table: % - %', r.table_name, SQLERRM;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '=== DATABASE FIX COMPLETED ===';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run: npx prisma db push --config=prisma.config.automation.ts';
    RAISE NOTICE '2. If successful, run: npx prisma generate --config=prisma.config.automation.ts';
    
END $$;

