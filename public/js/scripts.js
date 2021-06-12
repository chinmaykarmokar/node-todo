let itemsToDo = [];
let newItem;
let x = 0;

// Add Items to the list

let insertItems = () => {
    newItem = document.getElementById('items').value;
    itemsToDo.push(`<div>` + newItem + `</div> <button onclick="removeItems(` + x++ + `)">Delete</button>`);
    document.getElementById('showResults').innerHTML = itemsToDo;
    console.log(itemsToDo);
}

// Remove Items from the list

let removeItems = (id) => {
   let arrayIndex = id;
   let itemToBeRemoved = itemsToDo.splice(arrayIndex,1);
   console.log(itemToBeRemoved);
   console.log(itemsToDo);
}