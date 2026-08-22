const { jsPDF } = window.jspdf;

const imageInput = document.getElementById("imageInput");
const dropZone = document.getElementById("dropZone");
const preview = document.getElementById("preview");

const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");

const imageCount = document.getElementById("imageCount");

const pageSize = document.getElementById("pageSize");
const orientation = document.getElementById("orientation");
const margin = document.getElementById("margin");
const quality = document.getElementById("quality");

const pdfName = document.getElementById("pdfName");

const progressContainer =
    document.getElementById("progressContainer");

const progressBar =
    document.getElementById("progressBar");

const progressPercent =
    document.getElementById("progressPercent");

const themeBtn =
    document.getElementById("themeBtn");

let images = [];
let draggedIndex = null;


/* =========================
   SELECT IMAGES
========================= */

imageInput.addEventListener("change", function (event) {

    const files = Array.from(event.target.files);

    console.log("Selected files:", files);

    addImages(files);

    imageInput.value = "";

});


/* =========================
   ADD IMAGES
========================= */

function addImages(files) {

    files.forEach(file => {

        if (!file.type.startsWith("image/")) {
            return;
        }

        images.push({
            file: file,
            rotation: 0
        });

    });

    renderPreview();
}


/* =========================
   RENDER PREVIEW
========================= */

function renderPreview() {

    preview.innerHTML = "";

    imageCount.textContent =
        `${images.length} ${
            images.length === 1
                ? "image"
                : "images"
        }`;


    if (images.length === 0) {

        preview.innerHTML = `
            <div class="empty">
                <div>🖼️</div>
                <p>
                    Your selected images
                    will appear here
                </p>
            </div>
        `;

        clearBtn.disabled = true;

        return;
    }


    clearBtn.disabled = false;


    images.forEach((item, index) => {

        const card =
            document.createElement("div");

        card.className = "image-card";

        card.draggable = true;


        const img =
            document.createElement("img");

        img.src =
            URL.createObjectURL(item.file);

        img.style.transform =
            `rotate(${item.rotation}deg)`;


        const number =
            document.createElement("div");

        number.className =
            "image-number";

        number.textContent =
            `Image ${index + 1}`;


        const buttons =
            document.createElement("div");

        buttons.className =
            "card-buttons";


        const rotateBtn =
            document.createElement("button");

        rotateBtn.type = "button";

        rotateBtn.className =
            "rotate-btn";

        rotateBtn.textContent = "🔄";


        rotateBtn.onclick = function () {

            item.rotation =
                (item.rotation + 90) % 360;

            renderPreview();

        };


        const deleteBtn =
            document.createElement("button");

        deleteBtn.type = "button";

        deleteBtn.className =
            "delete-btn";

        deleteBtn.textContent = "🗑️";


        deleteBtn.onclick = function () {

            images.splice(index, 1);

            renderPreview();

        };


        buttons.appendChild(rotateBtn);
        buttons.appendChild(deleteBtn);

        card.appendChild(img);
        card.appendChild(number);
        card.appendChild(buttons);

        preview.appendChild(card);


        /* DRAG REORDER */

        card.addEventListener("dragstart", function () {

            draggedIndex = index;

        });


        card.addEventListener("dragover", function (event) {

            event.preventDefault();

        });


        card.addEventListener("drop", function (event) {

            event.preventDefault();

            if (
                draggedIndex === null ||
                draggedIndex === index
            ) {
                return;
            }


            const moved =
                images.splice(
                    draggedIndex,
                    1
                )[0];


            images.splice(
                index,
                0,
                moved
            );


            draggedIndex = null;

            renderPreview();

        });

    });

}


/* =========================
   CLEAR
========================= */

clearBtn.addEventListener("click", function () {

    images = [];

    renderPreview();

});


/* =========================
   CONVERT BUTTON
========================= */

convertBtn.addEventListener("click", async function () {

    console.log(
        "Convert clicked. Images:",
        images.length
    );


    if (images.length === 0) {

        alert(
            "Please select at least one image."
        );

        return;

    }


    convertBtn.textContent =
        "⏳ Creating PDF...";


    convertBtn.classList.add(
        "working"
    );


    progressContainer.hidden = false;

    progressBar.style.width = "0%";

    progressPercent.textContent = "0%";


    try {

        let pdf = null;


        for (
            let i = 0;
            i < images.length;
            i++
        ) {

            const item = images[i];


            /* Process image */

            const imageData =
                await processImage(
                    item.file,
                    item.rotation
                );


            const img =
                await loadImage(imageData);


            /* Orientation */

            let pdfOrientation =
                orientation.value;


            if (
                pdfOrientation === "auto"
            ) {

                pdfOrientation =
                    img.width > img.height
                        ? "landscape"
                        : "portrait";

            }


            /* FIT IMAGE */

            if (
                pageSize.value === "fit"
            ) {

                const width =
                    img.width / 3.78;

                const height =
                    img.height / 3.78;


                if (pdf === null) {

                    pdf = new jsPDF({

                        orientation:
                            pdfOrientation,

                        unit: "mm",

                        format: [
                            width,
                            height
                        ]

                    });

                } else {

                    pdf.addPage(
                        [
                            width,
                            height
                        ],
                        pdfOrientation
                    );

                }


                pdf.addImage(
                    imageData,
                    "JPEG",
                    0,
                    0,
                    width,
                    height
                );

            }


            /* NORMAL PAGE */

            else {

                if (pdf === null) {

                    pdf = new jsPDF({

                        orientation:
                            pdfOrientation,

                        unit: "mm",

                        format:
                            pageSize.value

                    });

                } else {

                    pdf.addPage(
                        pageSize.value,
                        pdfOrientation
                    );

                }


                const pageWidth =
                    pdf.internal
                    .pageSize
                    .getWidth();


                const pageHeight =
                    pdf.internal
                    .pageSize
                    .getHeight();


                const m =
                    Number(margin.value);


                const availableWidth =
                    pageWidth - m * 2;


                const availableHeight =
                    pageHeight - m * 2;


                const ratio =
                    img.width / img.height;


                let width =
                    availableWidth;


                let height =
                    width / ratio;


                if (
                    height >
                    availableHeight
                ) {

                    height =
                        availableHeight;

                    width =
                        height * ratio;

                }


                const x =
                    (pageWidth - width) / 2;


                const y =
                    (pageHeight - height) / 2;


                pdf.addImage(
                    imageData,
                    "JPEG",
                    x,
                    y,
                    width,
                    height
                );

            }


            /* Progress */

            const percent =
                Math.round(
                    ((i + 1) /
                        images.length) *
                    100
                );


            progressBar.style.width =
                `${percent}%`;

            progressPercent.textContent =
                `${percent}%`;


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        50
                    )
            );

        }


        /* Filename */

        let filename =
            pdfName.value.trim();


        if (!filename) {

            filename =
                "images-to-pdf";

        }


        filename =
            filename
                .replace(/\.pdf$/i, "");


        /* DOWNLOAD */

        pdf.save(
            `${filename}.pdf`
        );


        convertBtn.textContent =
            "✅ PDF Downloaded";


        setTimeout(() => {

            convertBtn.textContent =
                "📄 Convert to PDF";

        }, 2500);


    } catch (error) {

        console.error(
            "PDF ERROR:",
            error
        );


        alert(
            "Failed to create PDF.\n\n" +
            error.message
        );


        convertBtn.textContent =
            "❌ Conversion Failed";


        setTimeout(() => {

            convertBtn.textContent =
                "📄 Convert to PDF";

        }, 2500);

    }

});


/* =========================
   PROCESS IMAGE
========================= */

function processImage(file, rotation) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    const img =
                        new Image();


                    img.onload =
                        function () {

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            const rotated =
                                rotation === 90 ||
                                rotation === 270;


                            canvas.width =
                                rotated
                                    ? img.height
                                    : img.width;


                            canvas.height =
                                rotated
                                    ? img.width
                                    : img.height;


                            ctx.translate(
                                canvas.width / 2,
                                canvas.height / 2
                            );


                            ctx.rotate(
                                rotation *
                                Math.PI /
                                180
                            );


                            ctx.drawImage(
                                img,
                                -img.width / 2,
                                -img.height / 2
                            );


                            const q =
                                Number(
                                    quality.value
                                );


                            resolve(
                                canvas.toDataURL(
                                    "image/jpeg",
                                    q
                                )
                            );

                        };


                    img.onerror = reject;

                    img.src =
                        event.target.result;

                };


            reader.onerror = reject;

            reader.readAsDataURL(file);

        }
    );
}


/* =========================
   LOAD IMAGE
========================= */

function loadImage(src) {

    return new Promise(
        (resolve, reject) => {

            const img =
                new Image();

            img.onload =
                () => resolve(img);

            img.onerror =
                reject;

            img.src = src;

        }
    );

}


/* =========================
   DRAG & DROP
========================= */

dropZone.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        dropZone.classList.add(
            "dragover"
        );

    }
);


dropZone.addEventListener(
    "dragleave",
    function () {

        dropZone.classList.remove(
            "dragover"
        );

    }
);


dropZone.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        dropZone.classList.remove(
            "dragover"
        );

        addImages(
            event.dataTransfer.files
        );

    }
);


/* =========================
   DARK MODE
========================= */

themeBtn.addEventListener(
    "click",
    function () {

        document.body.classList.toggle(
            "dark"
        );


        const dark =
            document.body.classList.contains(
                "dark"
            );


        themeBtn.textContent =
            dark
                ? "☀️"
                : "🌙";


        localStorage.setItem(
            "darkMode",
            dark
        );

    }
);


/* RESTORE DARK MODE */

if (
    localStorage.getItem(
        "darkMode"
    ) === "true"
) {

    document.body.classList.add(
        "dark"
    );

    themeBtn.textContent = "☀️";

}


/* INITIAL */

renderPreview();
