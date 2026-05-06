const fetch = global.fetch || require('node-fetch');

async function test() {
    try {
        const uniqueEmail = `test${Date.now()}@test.com`;
        
        // Register
        console.log('Registering user...');
        const regRes = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'TestUser', email: uniqueEmail, password: 'password', phone: '0812345678', address: '123 Test St' })
        });
        const regData = await regRes.json();
        
        // Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: uniqueEmail, password: 'password' })
        });
        const loginData = await loginRes.json();
        console.log("Login res:", loginData);
        const token = loginData.token;
        const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
        console.log('Logged in successfully');

        // Fetch products
        const productsRes = await fetch('http://localhost:5000/api/products');
        const products = await productsRes.json();
        
        const availableProducts = products.filter(p => p.status === 'available');
        if (availableProducts.length < 2) {
            console.log('Not enough available products to test');
            return;
        }

        console.log(`Adding product ${availableProducts[0].id} to cart...`);
        let res1 = await fetch('http://localhost:5000/api/cart', { method: 'POST', ...config, body: JSON.stringify({ productId: availableProducts[0].id }) });
        console.log('Response 1:', await res1.json());

        console.log(`Adding product ${availableProducts[1].id} to cart...`);
        let res2 = await fetch('http://localhost:5000/api/cart', { method: 'POST', ...config, body: JSON.stringify({ productId: availableProducts[1].id }) });
        console.log('Response 2:', await res2.json());

        const cartRes = await fetch('http://localhost:5000/api/cart', { method: 'GET', ...config });
        const cartData = await cartRes.json();
        console.log(`Cart items count: ${cartData.length}`);
        console.log('Cart Items:', cartData.map(c => c.product_id));

    } catch(e) {
        console.error(e);
    }
}
test();
