
async function testStake() {
    const wallet = 'B4P3enKbE7b8SktEenEgf3sQb134AmHzMoZ4ua57uE3W';
    const payload = {
        walletAddress: wallet,
        prophecyId: 'poly_0x123', // dummy poly id
        prediction: true,
        stakeXP: 100
    };

    console.log('Testing stake with payload:', payload);

    try {
        const response = await fetch('http://localhost:3000/api/prophecy/stake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Stake response:', data);
    } catch (err) {
        console.error('Stake request failed:', err);
    }
}

testStake();
