
class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }  
    
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class HSLColor {
    constructor(h, s, l) {
        this.h = h; // [0-360]
        this.s = s; // [0-100]
        this.l = l; // [0-100]
    }

    toString() {
        return `hsl(${this.h}, ${this.s}%, ${this.l}%)`;
    }
}