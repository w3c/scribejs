'use strict';

function save_minutes() {
    const minutes = document.getElementById('minutes').value
    if (minutes && minutes !== '') {
        // Get hold of the content
        const mBlob = new Blob([minutes], {type: 'text/markdown'});
        const mURI = URL.createObjectURL(mBlob);

        const [year, month, day] = document.getElementById('date').value.split('-');
        const group = document.getElementById('group').value;
        const file_name = (group && group !== '') ? `${year}-${month}-${day}-${group}.md` : `${year}-${month}-${day}.md`

        // Pull it all together
        const download = document.getElementById('download');
        download.href = mURI;
        download.download = file_name;
        download.click();
    }
}

window.addEventListener( 'load', (e) => {
    // Set up the event handlers
    const save_button = document.getElementById('save');
    save_button.addEventListener('click', save_minutes);
});
