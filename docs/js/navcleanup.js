// Removes +/- box on the navbar
window.addEventListener('load', (event) => {
    let w = $(document.getElementsByClassName('toctree-expand'))

    for (let i = 0; i < w.length; i++){
        w.remove()
    }
});

// Indents sections in navbar
$('.toctree-l1').css("padding", "+=5");

// Removes "Built with MkDocs using a theme provided by Read the Docs." in footer
function removeBuiltByString() {

    let x = document.getElementsByTagName("footer");
    for(let i = 0; i < x[0].childNodes.length; i++) {

        if (x[0].childNodes[i].textContent.trim() == 'Built with') {

            let removeElemets = x[0].childNodes.length - i;
            for (let extra = 0; extra < removeElemets; extra++){

                x[0].removeChild(x[0].childNodes[i]);
            }

            console.log(x[0].childNodes);
            break
        }
    }
}

removeBuiltByString();

