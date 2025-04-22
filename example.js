
const wave = {

    init: function(){
        this.M = 100
        this.mesh_flow = 0.1
        this.C = 0.01

        //const initialState = Float32Array.from( { length: this.M }, () => 1 + (2 * Math.random() - 1) * this.mesh_flow )
        const initialState = new Float32Array(this.M)
        initialState[49] = 1/10
        initialState[50] = 1/5
        initialState[51] = 1/10

        this.w = [Float32Array.from(initialState), Float32Array.from(initialState), Float32Array.from(initialState)];
    },

    update: function(){
        const w = this.w
        w[2] = w[1]
        w[1] = w[0]
        w[0] = new Float32Array(this.M)

        for (let i=0; i<this.M; i++) {
            let im1 = (i - 1 + this.M) % this.M
            let ip1 = (i + 1) % this.M

            w[0][i] = 2*w[1][i] + this.C*(w[1][ip1] - 2*w[1][i] + w[1][im1]) - w[2][i]
        }

        //w[0] = w[0].map(e => Math.min(Math.max(e, 1-this.mesh_flow), 1+this.mesh_flow));
    },

    draw: function(ctx){
        const w = this.w[0]
        for (let i = 0; i < w.length-1; i++) {
            ctx.lineWidth = Math.min(1/this.scale, 50);
            ctx.strokeStyle = 'white';
            ctx.setLineDash([])

            ctx.beginPath();
            ctx.moveTo(i*10, w[i]*100)

            ctx.lineTo((i+1)*10, w[i+1]*100)
            ctx.stroke()
        }
    }
}
