const shopContent = document.getElementById("shopContent"); // Seleccionar el contenedor de la tienda
const cart = []; // Inicializar un array vacío para el carrito de compras

productos.forEach((product) => {
  // Iterar sobre cada producto en el array de productos
  const content = document.createElement("div"); // Crear un contenedor para cada producto
  content.innerHTML = ` 
        <img src="${product.img}">
        <h3>${product.productName}</h3>
        <p>${product.price} $</p>
    `;
  shopContent.append(content); // Agregar el contenedor al contenedor de la tienda

  const buyButton = document.createElement("button"); // Crear un botón de compra
  buyButton.innerText = "Comprar";
  content.append(buyButton); // Agregar el botón al contenido del producto

  buyButton.addEventListener("click", () => {
    // Lógica para agregar el producto al carrito de compras
    const repeat = cart.some(
      (repeatProduct) => repeatProduct.id === product.id,
    ); // Verificar si el producto ya está en el carrito

    if (repeat) {
      cart.map((prod) => {
        if (prod.id === product.id) {
          prod.quanty++;
        }
      });
    } else {
      cart.push({
        id: product.id,
        productName: product.productName,
        price: product.price,
        quanty: product.quanty,
        img: product.img,
      });
    }
  });
});
