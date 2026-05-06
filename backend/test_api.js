async function test() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@gmail.com', password: 'password' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        const config = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };

        const productsRes = await fetch('http://localhost:5000/api/products');
        const products = await productsRes.json();
        if(products.length < 2) { console.log('Not enough products'); process.exit(0); }

        console.log(`Adding ${products[0].id} and ${products[1].id} to cart`);
        
        await fetch('http://localhost:5000/api/cart', { method: 'POST', ...config, body: JSON.stringify({ productId: products[0].id }) });
        await fetch('http://localhost:5000/api/cart', { method: 'POST', ...config, body: JSON.stringify({ productId: products[1].id }) });

        const cartRes = await fetch('http://localhost:5000/api/cart', { method: 'GET', ...config });
        const cartData = await cartRes.json();
        console.log('cartData:', cartData);
        console.log(cartData.map(item => item.product_id));

    } catch (e) {
        console.error(e.message);
    }
}
test();
