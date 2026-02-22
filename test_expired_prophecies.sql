-- Seed an expired prophecy to test resolution
INSERT INTO prophecies (id, title, description, condition_type, condition_value, deadline, min_stake, max_stake, win_multiplier, type, status, total_yes_pool, total_no_pool)
VALUES 
(
    gen_random_uuid(),
    'JUP_HISTORICAL_TEST', 
    'Verify if JUP was above $0.01 at the time of resolution (guaranteed YES for testing).', 
    'price_above', 
    '{"threshold": 0.01}', 
    (now() - interval '1 hour'), -- Expired 1 hour ago
    10, 
    1000, 
    1.0, 
    'feed',
    'active',
    5000, -- Simulated 5000 XP in YES
    1000  -- Simulated 1000 XP in NO
);

INSERT INTO prophecies (id, title, description, condition_type, condition_value, deadline, min_stake, max_stake, win_multiplier, type, status, total_yes_pool, total_no_pool)
VALUES 
(
    gen_random_uuid(),
    'SOL_HISTORICAL_TEST', 
    'Verify if SOL was below $10.00 at the time of resolution (guaranteed NO for testing).', 
    'price_below', 
    '{"threshold": 10.00}', 
    (now() - interval '2 hours'), -- Expired 2 hours ago
    10, 
    1000, 
    1.0, 
    'feed',
    'active',
    2000, -- Simulated 2000 XP in YES
    8000  -- Simulated 8000 XP in NO
);
