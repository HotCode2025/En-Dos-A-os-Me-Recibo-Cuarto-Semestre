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
    cart.push({
      id: product.id,
      productName: product.productName,
      price: product.price,
      quanty: product.quanty,
      img: product.img,
    });
    console.log(cart); // Mostrar el carrito en la consola para verificar
  });
});
