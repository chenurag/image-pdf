const { jsPDF } = window.jspdf;


/* ELEMENTS */

const imageInput =
    document.getElementById("imageInput");

const dropZone =
    document.getElementById("dropZone");

const preview =
    document.getElementById("preview");

const convertBtn =
    document.getElementById("convertBtn");

const clearBtn =
    document.getElementById("clearBtn");

const imageCount =
    document.getElementById("imageCount");

const pageSize =
    document.getElementById("pageSize");

const orientation =
    document.getElementById("orientation");

const margin =
    document.getElementById("margin");

const quality =
    document.getElementById("quality");

const pdfName =
    document.getElementById("pdfName");

const progressContainer =
    document.getElementById(
        "progressContainer"
    );

const progressBar =
    document.getElementById("progressBar");

const progressPercent =
    document.getElementById(
        "progressPercent"
    );

const themeBtn =
    document.getElementById("themeBtn");


/* DATA */

let images = [];

let draggedIndex = null;


/* SELECT IMAGES */

imageInput.addEventListener(
    "change",
    event => {

        addImages(event.target.files);

        /*
         * Allows the user to select
         * the same file again later.
         */

        imageInput.value = "";

    }
);


/* ADD IMAGES */

function addImages(files) {

    for (const file of files) {

        if (!file.type.startsWith("image/")) {

            continue;

        }

        images.push({

            file: file,

            rotation: 0

        });

    }

    renderPreview();

}


/* DRAG & DROP */

dropZone.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        dropZone.classList.add(
            "dragover"
        );

    }
);

dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove(
            "dragover"
        );

    }
);

dropZone.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        dropZone.classList.remove(
            "dragover"
        );

        addImages(
            event.dataTransfer.files
        );

    }
);


/* RENDER */

function renderPreview() {

    preview.innerHTML = "";

    imageCount.textContent =
        `${images.length} ${
            images.length === 1
                ? "image"
                : "images"
        }`;

    convertBtn.disabled =
        images.length === 0;

    clearBtn.disabled =
        images.length === 0;


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

        return;

    }


    images.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "image-card";

            card.draggable = true;


            /* IMAGE */

            const img =
                document.createElement(
                    "img"
                );

            img.src =
                URL.createObjectURL(
                    item.file
                );

            img.style.transform =
                `rotate(${item.rotation}deg)`;


            /* NUMBER */

            const number =
                document.createElement(
                    "div"
                );

            number.className =
                "image-number";

            number.textContent =
                `Image ${index + 1}`;


            /* BUTTONS */

            const buttons =
                document.createElement(
                    "div"
                );

            buttons.className =
                "card-buttons";


            const rotate =
                document.createElement(
                    "button"
                );

            rotate.className =
                "rotate-btn";

            rotate.textContent =
                "🔄";

            rotate.title =
                "Rotate";


            rotate.onclick = () => {

                item.rotation =
                    (item.rotation + 90)
                    % 360;

                renderPreview();

            };


            const deleteBtn =
                document.createElement(
                    "button"
                );

            deleteBtn.className =
                "delete-btn";

            deleteBtn.textContent =
                "🗑️";

            deleteBtn.title =
                "Delete";


            deleteBtn.onclick = () => {

                images.splice(
                    index,
                    1
                );

                renderPreview();

            };


            buttons.appendChild(
                rotate
            );

            buttons.appendChild(
                deleteBtn
            );


            card.appendChild(img);

            card.appendChild(number);

            card.appendChild(buttons);


            /* DRAG REORDER */

            card.addEventListener(
                "dragstart",
                () => {

                    draggedIndex =
                        index;

                    card.style.opacity =
                        "0.5";

                }
            );


            card.addEventListener(
                "dragend",
                () => {

                    card.style.opacity =
                        "1";

                }
            );


            card.addEventListener(
                "dragover",
                event => {

                    event.preventDefault();

                }
            );


            card.addEventListener(
                "drop",
                event => {

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

                }
            );


            preview.appendChild(card);

        }
    );

}


/* CLEAR */

clearBtn.addEventListener(
    "click",
    () => {

        images = [];

        renderPreview();

    }
);


/* CONVERT */

convertBtn.addEventListener(
    "click",
    async () => {

        if (!images.length) {

            alert(
                "Please select images first."
            );

            return;

        }


        convertBtn.disabled = true;

        progressContainer.hidden =
            false;

        progressBar.style.width =
            "0%";

        progressPercent.textContent =
            "0%";


        try {

            let pdf = null;


            for (
                let i = 0;
                i < images.length;
                i++
            ) {

                const item =
                    images[i];


                /*
                 * Compress image
                 */

                const data =
                    await processImage(
                        item.file,
                        item.rotation
                    );


                const img =
                    await loadImage(data);


                /*
                 * Orientation
                 */

                let pdfOrientation =
                    orientation.value;


                if (
                    pdfOrientation ===
                    "auto"
                ) {

                    pdfOrientation =
                        img.width >
                        img.height
                            ? "landscape"
                            : "portrait";

                }


                /*
                 * Fit image
                 */

                if (
                    pageSize.value ===
                    "fit"
                ) {

                    const width =
                        img.width / 3.78;

                    const height =
                        img.height / 3.78;


                    if (!pdf) {

                        pdf =
                            new jsPDF({

                                orientation:
                                    pdfOrientation,

                                unit: "mm",

                                format:
                                    [
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
                        data,
                        "JPEG",
                        0,
                        0,
                        width,
                        height
                    );

                }

                else {

                    /*
                     * Standard page
                     */

                    if (!pdf) {

                        pdf =
                            new jsPDF({

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
                        Number(
                            margin.value
                        );


                    const availableWidth =
                        pageWidth -
                        m * 2;


                    const availableHeight =
                        pageHeight -
                        m * 2;


                    const ratio =
                        img.width /
                        img.height;


                    let width =
                        availableWidth;


                    let height =
                        width /
                        ratio;


                    if (
                        height >
                        availableHeight
                    ) {

                        height =
                            availableHeight;

                        width =
                            height *
                            ratio;

                    }


                    const x =
                        (
                            pageWidth -
                            width
                        ) / 2;


                    const y =
                        (
                            pageHeight -
                            height
                        ) / 2;


                    pdf.addImage(
                        data,
                        "JPEG",
                        x,
                        y,
                        width,
                        height
                    );

                }


                /*
                 * Progress
                 */

                const percent =
                    Math.round(
                        (
                            (i + 1) /
                            images.length
                        ) * 100
                    );


                progressBar.style.width =
                    `${percent}%`;

                progressPercent.textContent =
                    `${percent}%`;


                /*
                 * Give browser
                 * time to update UI
                 */

                await sleep(50);

            }


            /*
             * Filename
             */

            let filename =
                pdfName.value.trim();


            if (!filename) {

                filename =
                    "images-to-pdf";

            }


            if (
                filename
                .toLowerCase()
                .endsWith(".pdf")
            ) {

                filename =
                    filename.slice(
                        0,
                        -4
                    );

            }


            pdf.save(
                `${filename}.pdf`
            );


        }

        catch (error) {

            console.error(error);

            alert(
                "An error occurred while creating the PDF."
            );

        }


        convertBtn.disabled =
            images.length === 0;

    }
);


/* PROCESS IMAGE */

function processImage(
    file,
    rotation
) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const img =
                        new Image();


                    img.onload = () => {

                        const canvas =
                            document
                            .createElement(
                                "canvas"
                            );


                        const ctx =
                            canvas.getContext(
                                "2d"
                            );


                        const angle =
                            rotation *
                            Math.PI /
                            180;


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


                        ctx.rotate(angle);


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


                    img.onerror =
                        reject;


                    img.src =
                        event.target.result;

                };


            reader.onerror =
                reject;


            reader.readAsDataURL(file);

        }
    );

}


/* LOAD IMAGE */

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


/* SLEEP */

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


/* DARK MODE */

themeBtn.addEventListener(
    "click",
    () => {

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


/* RESTORE THEME */

if (
    localStorage.getItem(
        "darkMode"
    ) === "true"
) {

    document.body.classList.add(
        "dark"
    );

    themeBtn.textContent =
        "☀️";

}


/* INITIAL */

renderPreview();
