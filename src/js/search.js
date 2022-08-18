// minimum height for .content should fill entire page so that footer is at bottom
document.querySelector('.content').style.minHeight = `calc(100vh - 102px - ${document.querySelector('footer').offsetHeight}px)`

// Display empty search results on page load
displayPeople([])  

// Attach event handler to input
// Debounce function call to prevent API spam
const searchInput = document.getElementById('search')
searchInput.oninput = _.debounce(search, 400)



// Takes a parent and kills all the kids
function genocide(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}



// Outputs search results
// Accepts an array of results
function displayPeople(results) {
  // DOM node to put elements in
  output = document.getElementById('people')

  // Clear previous results
  genocide(output)

  // Map each result object into an HTML node
  // results can be undefined (invalid api call) or empty (no search results)
  // In those cases output an error string
  if(results && results.length) { 
    /*  For every object in results map it to a DOM node
     *  HTML Structure: 
     *
     *  <div class="person">
     *    <img src="https://image.source.com" />
     *    <h4>Name</h4>
     *    <p>Major</p>
     *    <p>Classification</p>
     *  </div>
     */
    let nodes = results.map(result => {
      // Create .person
      let person = document.createElement('div')
      person.classList.add('person')
      
      // Create image
      // Use blank image if none exist
      let img = document.createElement('img')
      if (result.image)
        img.src = 'http://bjuvintage.com' + result.image
      else
        img.src = 'http://www.bjuvintage.com/2020/static/img/notPictured_portrait.png'     
      person.appendChild(img)

      // Create name
      let name = document.createElement('h4')
      name.textContent += result.name
      person.appendChild(name)

      // Create major
      let major = document.createElement('p')
      major.textContent += result.major
      person.appendChild(major)

      // Create classification
      let classification = document.createElement('p')
      classification.textContent += result.classification
      person.appendChild(classification)

      // Add person to results output
      return person
    })
    output.append(...nodes)
  } else {
    let p = document.createElement('p')
    p.innerText = 'No results...'
    output.append(p)
  }
}



// Search event handler
// Accepts event parameter
async function search(e) {
  // Create request body
  const query = e.target.value
  const options = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({year: 2021, query})
  }

  // Call API
  // Display results or error
  try {
    let response = await fetch('https://5tlzzz9460.execute-api.us-east-2.amazonaws.com/default/search-v2', options)
    let results = await response.json()
    console.log(results)
    displayPeople(results.people) 
  } catch(e) {
    console.log(e.message)
  }
}
