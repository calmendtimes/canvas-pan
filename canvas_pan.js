
class View {

    constructor(canvas, renderer) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        
        this.canvas = canvas

        this.ctx = canvas.getContext('2d')
        this.renderer = renderer

        // View //
        this.ORIGIN_OFFSET = new Vector2(this.canvas.width/2, this.canvas.height/2) 
        this.scale = 1;                 // size of one pixel in pixels, no ?
        this.origin = new Vector2(0,0)  // {0,0} displacement in html (screen pixels) coordinates
        this.origin_displacement = new Vector2(0,0) 
        this.bounding_rect = { x1:0, y1:0, x2:0, y2:0, width:this.canvas.width, height:this.canvas.height }

        // input //
        this.mouse = { html_coordinates: new Vector2(NaN, NaN), canvas_coordinates: new Vector2(NaN, NaN) }
        this.canvas.addEventListener('click',       (event) => this.onClick(event))
        this.canvas.addEventListener('mousedown',   (event) => this.onMouseDown(event))
        this.canvas.addEventListener('mousemove',   (event) => this.onMouseMove(event))
        this.canvas.addEventListener('wheel',       (event) => this.onWheel(event))
        document.addEventListener   ('mouseup',     (event) => this.onMouseUp(event))
    }

    setDrawOnEvent(bool) {
        this.draw_on_event = bool
    }

    // View manipulation //
    cennterAtPoint({x,y}) {
        this.resetFocusRectangle()
        this.origin_displacement.x = -x * this.scale
        this.origin_displacement.y = -y * this.scale
    }

    focusRectangle({x1,y1,x2,y2}) {
        const width = x2 - x1;
        const height = y2 - y1;
        const scale = Math.min(this.canvas.width / width, this.canvas.height / height)
        this.scale = scale
        
        const emptyOffset_x = this.canvas.width / 2 - width * scale / 2
        const emptyOffset_y = this.canvas.height / 2 - height * scale / 2

        this.origin_displacement.x = -x1*scale - this.ORIGIN_OFFSET.x + emptyOffset_x
        this.origin_displacement.y = -y1*scale - this.ORIGIN_OFFSET.y + emptyOffset_y
        
        this.focus_rectangle = {x1,y1,x2,y2}
    }  
    
    resetFocusRectangle() {
        this.focus_rectangle = null
    }

    zoom(multiplier, {x=this.ORIGIN_OFFSET.x, y=this.ORIGIN_OFFSET.y} = {}) {
        this.resetFocusRectangle()
        const prev_scale = this.scale
        this.scale *= multiplier
        this.scale = Math.max(this.scale, 1e-5)
        this.scale = Math.min(this.scale, 1e+5)
        
        this.origin_displacement.x -= (x - this.origin.x) * (this.scale-prev_scale)/prev_scale
        this.origin_displacement.y -= (y - this.origin.y) * (this.scale-prev_scale)/prev_scale
    
        this.origin.x = this.ORIGIN_OFFSET.x + this.origin_displacement.x
        this.origin.y = this.ORIGIN_OFFSET.y + this.origin_displacement.y
    }

    updateTransform() {
        this.bounding_rect.width = this.canvas.width/this.scale
        this.bounding_rect.height = this.canvas.height/this.scale
        this.bounding_rect.x1 = -this.origin_displacement.x/this.scale - this.ORIGIN_OFFSET.x/this.scale
        this.bounding_rect.y1 = -this.origin_displacement.y/this.scale - this.ORIGIN_OFFSET.y/this.scale
        this.bounding_rect.x2 = this.bounding_rect.x1 + this.bounding_rect.width 
        this.bounding_rect.y2 = this.bounding_rect.y1 + this.bounding_rect.height
        
        this.origin.x = this.ORIGIN_OFFSET.x + this.origin_displacement.x
        this.origin.y = this.ORIGIN_OFFSET.y + this.origin_displacement.y
    }
    
    htmlToCanvasCoordinates({x,y}) {
        return {
            x: Math.round((x - this.origin.x) / this.scale),
            y: Math.round((y - this.origin.y) / this.scale)
        }
    }

    updateMouseCoordinates() {
        this.mouse.canvas_coordinates = this.htmlToCanvasCoordinates(this.mouse.html_coordinates)
        return this.mouse
    }

    
    // Draw //
    draw(){
        this.updateTransform()

        this.ctx.fillStyle = '#222';  // Set background color to light blue
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); 
        this.ctx.save()
        this.ctx.setTransform(this.scale, 0, 0, this.scale, this.origin.x, this.origin.y)
    
        this.renderer.drawGrid(this.bounding_rect, this.scale)
        this.renderer.drawBoundingRect(this.bounding_rect, this.scale)
        this.renderer.drawFocusRectangle(this.focus_rectangle)
        this.renderer.customDraw?.(this.ctx)

        this.ctx.restore()
        
        if(DEBUG) {
            this.renderer.drawDebugInfo(this.mouse, this.origin)
        }
    }

    drawOnEvent() {
        if(this.draw_on_event) {
            this.draw()
        }
    }


    // Input handling //
    setOnClick(onClickCallback) {
        // onClickCallback({x,y}})
        this.onClickCallback = onClickCallback
    }

    setOnMouseDown(onMouseDownCallback) {
        // onMouseDownCallback({x,y}})
        this.onMouseDownCallback = onMouseDownCallback
    }

    setOnMouseUp(onMouseUpCallback) {
        // onMouseUpCallback({x,y}})
        this.onMouseUpCallback = onMouseUpCallback
    }

    setOnMouseMove(onMouseMoveCallback) {
        // onMouseMoveCallback({x,y}})
        this.onMouseMoveCallback = onMouseMoveCallback
    }

    onClick(event) {
        const callback_result = this.onClickCallback?.(this.htmlToCanvasCoordinates({x:event.offsetX, y:event.offsetY}))

        if(!callback_result?.preventDefault) {
            // pass
        }

        this.drawOnEvent()
    }
    
    onMouseDown(event) {
        const callback_result = this.onMouseDownCallback?.(this.htmlToCanvasCoordinates({x:event.offsetX, y:event.offsetY}))

        if(!callback_result?.preventDefault) {
            this.move_handling = {
                mouse_down_coordinates: { x:event.offsetX, y:event.offsetY },
                origin_displacement_initial: { x:this.origin_displacement.x, y:this.origin_displacement.y },
                origin_displacement_in_progress: { x:this.origin_displacement.x, y:this.origin_displacement.y }
            }
        }

        this.drawOnEvent()
    }
    
    onMouseUp(event) {
        const callback_result = this.onMouseUpCallback?.(this.htmlToCanvasCoordinates({x:event.offsetX, y:event.offsetY}))

        if(!callback_result?.preventDefault) {
            if (this.move_handling) {
                this.origin_displacement.x = this.move_handling.origin_displacement_in_progress.x
                this.origin_displacement.y = this.move_handling.origin_displacement_in_progress.y
                this.move_handling = null
            }
        }

        this.drawOnEvent()
    }
    
    onMouseMove(event) {
        const callback_result = this.onMouseMoveCallback?.(this.htmlToCanvasCoordinates({x:event.offsetX, y:event.offsetY}))

        if(!callback_result?.preventDefault) {
            const htmlCoordinates = {x:event.offsetX, y:event.offsetY}

            if(this.move_handling) {
                this.move_handling.origin_displacement_in_progress = {
                    x: this.move_handling.origin_displacement_initial.x + htmlCoordinates.x - this.move_handling.mouse_down_coordinates.x, 
                    y: this.move_handling.origin_displacement_initial.y + htmlCoordinates.y - this.move_handling.mouse_down_coordinates.y
                }
                this.origin_displacement.x = this.move_handling.origin_displacement_in_progress.x
                this.origin_displacement.y = this.move_handling.origin_displacement_in_progress.y
            }
        
            this.mouse.html_coordinates = htmlCoordinates
            this.updateMouseCoordinates()
        }

        this.drawOnEvent()
    }
    
    onWheel(event) {
        const multiplier = event.deltaY < 0 ? 1.1 : 0.9    
        this.zoom(multiplier, {x:event.offsetX, y:event.offsetY})  
        this.drawOnEvent()
    }
}


class Renderer {

    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    drawFocusRectangle(focus_rectangle){
        const fr = focus_rectangle
        if(fr) {
            this.ctx.beginPath();
            this.ctx.setLineDash([3, 10]);
            this.ctx.rect(fr.x1, fr.y1, fr.x2 - fr.x1, fr.y2 - fr.y1);
            this.ctx.lineWidth = 1/this.scale;
            this.ctx.strokeStyle = "red";
            this.ctx.stroke();
            this.ctx.closePath();
        }
    }

    drawGrid(bounding_rect, scale) {
        const br = bounding_rect
      
        const drawGrid = (step, color) => {
            let vl = Math.ceil(br.x1/step)*step
            while(vl < br.x2) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 0.5/scale;
                this.ctx.strokeStyle = color;
                this.ctx.moveTo(vl, br.y1)
                this.ctx.lineTo(vl, br.y2)
                this.ctx.stroke();
                vl += step
            }
        
            let hl = Math.ceil(br.y1/step)*step
            while(hl < br.y2) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 0.5/scale;
                this.ctx.strokeStyle = color;
                this.ctx.moveTo(br.x1, hl)
                this.ctx.lineTo(br.x2, hl)
                this.ctx.stroke();
                hl += step
            }
        }

        const step = Math.pow(10, Math.floor(Math.log10(br.width)))
        const alpha = 1 - br.width / step / 10
        drawGrid(step/10, `hsla(0, 0%, 30%, ${alpha})`)       
        drawGrid(step,    `hsl(0, 0%, 30%)`)
    }

    drawBoundingRect(bounding_rect, scale){
        const br = bounding_rect
        this.ctx.beginPath();
        this.ctx.rect(br.x1, br.y1, br.width, br.height);
        this.ctx.lineWidth = 1/scale;
        this.ctx.strokeStyle = "magenta";
        this.ctx.stroke();
        this.ctx.closePath();
    
        this.ctx.beginPath();
        this.ctx.lineWidth = 1/scale;
        this.ctx.strokeStyle = `hsl(0, 0%, 40%)`;
        this.ctx.moveTo(br.x1, 0)
        this.ctx.lineTo(br.x2, 0)
        this.ctx.stroke();
    
        this.ctx.beginPath();
        this.ctx.moveTo(0, br.y1)
        this.ctx.lineTo(0, br.y2)
        this.ctx.stroke();
    }

    drawDebugInfo(mouse, origin){
        this.ctx.font           = "14px Courier New";
        this.ctx.fillStyle      = "white";

        if(mouse.html_coordinates) {
            const text_canvas       = `canvas: (${mouse.html_coordinates.x}, ${mouse.html_coordinates.y})`
            const text_coordinates  = `coordinates: (${mouse.canvas_coordinates.x}, ${mouse.canvas_coordinates.y})`
            const text_origin       = `origin: (${Math.round(origin.x)}, ${Math.round(origin.y)})`
            this.ctx.fillText(text_canvas,      mouse.html_coordinates.x, mouse.html_coordinates.y + 20);
            this.ctx.fillText(text_coordinates, mouse.html_coordinates.x, mouse.html_coordinates.y + 30);
            this.ctx.fillText(text_origin,      mouse.html_coordinates.x, mouse.html_coordinates.y + 40);
        }
    
        this.ctx.fillText("origin", origin.x, origin.y);
    }

    setCustomDrawFunction(drawFunction) {
        this.customDraw = drawFunction
    }
}


class Loop {
    constructor(view) {
        this.view = view
        this._run = this._run.bind(this);
        this.keepRunning = false
    }

    _run() {
        this.view.draw()

        if(this.keepRunning){
            requestAnimationFrame(this._run);
        }
    }

    run() {
        this.keepRunning = true
        this._run()
    }

    pause() {
        this.keepRunning = false
    }
}


class CanvasPan {

    constructor(cavnas) {
        this.canvas = canvas
        this.renderer = new Renderer(canvas)
        this.view = new View(canvas, this.renderer)
        this.loop = new Loop(this.view)
    }

    drawOnAnimationFrame() {
        this.view.setDrawOnEvent(false)
        this.loop.run()
    }

    drawOnEvents() {
        this.loop.pause()
        this.view.draw()
        this.view.setDrawOnEvent(true)
    }
}
