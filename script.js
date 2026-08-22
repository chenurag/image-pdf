const { jsPDF } = window.jspdf;

const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const preview = document.getElementById("preview");
const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");

const pageSize = document.getElementById("pageSize");
const orientation = document.getElementById("orientation");
const margin = document.getElementById("margin");

let images = [];

imageInput.addEventListener("change", function () {
    addImages(this.files);
});

dropZone.addEventListener("dragover", function (event) {
    event.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", function (event) {
    event.preventDefault();

    dropZone.classList.remove("dragover");

    addImages(event.dataTransfer.files);
});

function addImages(files) {

    for (const file of files) {

        if (!file.type.startsWith("image/")) {
            continue;
        }

        images.push(file);
    }

    renderPreview();
}

function renderPreview() {

    preview.innerHTML = "";

    images.forEach((file, index) => {

        const card = document.createElement("div");
        card.className = "image-card";

        const img = document.createElement("img");

        img.src = URL.createObjectURL(file);

        const number = document.createElement("div");
        number.className = "image-number";
        number.textContent = `Image ${index + 1}`;

        const remove = document.createElement("button");
        remove.className = "remove-btn";
        remove.textContent = "×";

        remove.onclick = function () {

            images.splice(index, 1);

            renderPreview();
        };

        card.appendChild(img);
        card.appendChild(number);
        card.appendChild(remove);

        preview.appendChild(card);
    });

    convertBtn.disabled = images.length === 0;
    clearBtn.disabled = images.length === 0;
}

clearBtn.addEventListener("click", function () {

    images = [];

    imageInput.value = "";

    renderPreview();
});

convertBtn.addEventListener("click", async function () {

    if (images.length === 0) {
        return;
    }

    convertBtn.disabled = true;
    convertBtn.textContent = "Creating PDF...";

    try {

        let pdf = null;

        for (let i = 0; i < images.length; i++) {

            const file = images[i];

            const dataURL = await fileToDataURL(file);

            const img = await loadImage(dataURL);

            let format = pageSize.value;

            if (format === "fit") {

                const width = img.width;
                const height = img.height;

                const pdfWidth = width / 3.78;
                const pdfHeight = height / 3.78;

                const pageOrientation =
                    width > height ? "landscape" : "portrait";

                if (!pdf) {

                    pdf = new jsPDF({
                        orientation: pageOrientation,
                        unit: "mm",
                        format: [pdfWidth, pdfHeight]
                    });

                } else {

                    pdf.addPage(
                        [pdfWidth, pdfHeight],
                        pageOrientation
                    );
                }

                pdf.addImage(
                    dataURL,
                    getImageFormat(file),
                    0,
                    0,
                    pdfWidth,
                    pdfHeight
                );

                continue;
            }

            let pageOrientation = orientation.value;

            if (pageOrientation === "auto") {
                pageOrientation =
                    img.width > img.height
                        ? "landscape"
                        : "portrait";
            }

            if (i === 0) {

                pdf = new jsPDF({
                    orientation: pageOrientation,
                    unit: "mm",
                    format: format
                });

            } else {

                pdf.addPage(format, pageOrientation);
            }

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const m = Number(margin.value);

            const availableWidth = pageWidth - m * 2;
            const availableHeight = pageHeight - m * 2;

            const imageRatio = img.width / img.height;

            let width = availableWidth;
            let height = width / imageRatio;

            if (height > availableHeight) {

                height = availableHeight;
                width = height * imageRatio;
            }

            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;

            pdf.addImage(
                dataURL,
                getImageFormat(file),
                x,
                y,
                width,
                height
            );
        }

        pdf.save("images-to-pdf.pdf");

    } catch (error) {

        console.error(error);

        alert("Something went wrong while creating the PDF.");

    } finally {

        convertBtn.disabled = false;
        convertBtn.textContent = "Convert to PDF";
    }
});

function fileToDataURL(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

function loadImage(src) {

    return new Promise((resolve, reject) => {

        const img = new Image();

        img.onload = () => resolve(img);

        img.onerror = reject;

        img.src = src;
    });
}

function getImageFormat(file) {

    if (file.type === "image/png") {
        return "PNG";
    }

    if (file.type === "image/webp") {
        return "WEBP";
    }

    return "JPEG";
}
