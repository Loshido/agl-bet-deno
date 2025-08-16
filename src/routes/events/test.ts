const response = await fetch('http://localhost:5173/events')

const decoder = new TextDecoder()
if(response.body) {
    for await (const chunk of response.body) {
        console.info(decoder.decode(chunk))
    }
}
