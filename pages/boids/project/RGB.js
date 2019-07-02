export class RGB {
    r = 0;
    g = 0;
    b = 0;

    constructor(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }

    static createFromHSV(h, s, v) {
        if (s > 1.0) {
            s = 1.0;
        }

        if (v > 1.0) {
            v = 1.0;
        }

        let th = (h + 360) % 360;
        let i = Math.floor(th / 60);
        let f = th / 60 - i;
        let m = v * (1 - s);
        let n = v * (1 - s * f);
        let k = v * (1 - s * (1 - f));

        let color;
        if (s === 0) {
            color = new RGB(v, v, v);
        }
        else {
            switch (i) {
                case 0: {
                    color = new RGB(v, k, m);
                    break;
                }
                case 1: {
                    color = new RGB(n, v, m);
                    break;
                }
                case 2: {
                    color = new RGB(m, v, k);
                    break;
                }
                case 3: {
                    color = new RGB(m, n, v);
                    break;
                }
                case 4: {
                    color = new RGB(k, m, v);
                    break;
                }
                case 5: {
                    color = new RGB(v, m, n);
                    break;
                }
            }
        }
        return color;
    }
}
RGB.r = 0;
RGB.g = 0;
RGB.b = 0;
