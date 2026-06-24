async function simulateMFT() {

    const response =
        await fetch("/simulate-mft", {

            method: "POST",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

                algorithm: "best_fit",

                partitions: [
                    100,
                    250,
                    300,
                    374
                ],

                processes: [
                    90,
                    120,
                    200,
                    80
                ]
            })
        });

    const data =
        await response.json();

    console.log(data);
}


async function simulateMVT() {

    const response =
        await fetch("/simulate-mvt", {

            method: "POST",

            headers: {
                "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

                mode:
                "without_compaction",

                total_memory:
                1024,

                os_size:
                100,

                processes: [
                    200,
                    100,
                    250,
                    180
                ]
            })
        });

    const data =
        await response.json();

    console.log(data);
}