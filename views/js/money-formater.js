function formater(value) {
    var n = value.split(".");
    console.log(n);
    n[0] = n[0].replace(/[\D\s\._\-]+/g, "");
    for (let index = 2; index < n.length; index++) {
        const element = n[index];
        n[1] += element;
        delete n[index];
    }
    if (n[1] !== undefined) {
        n[1] = n[1].replace(/[\D\s\._\-]+/g, "");
    }
    n[0] = n[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return n.join(".");
}