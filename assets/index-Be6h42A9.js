(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=typeof Float32Array<`u`?Float32Array:Array;Math.PI/180,180/Math.PI;function t(){var t=new e(16);return e!=Float32Array&&(t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0),t[0]=1,t[5]=1,t[10]=1,t[15]=1,t}function n(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function r(e,t,n){var r=t[0],i=t[1],a=t[2],o=t[3],s=t[4],c=t[5],l=t[6],u=t[7],d=t[8],f=t[9],p=t[10],m=t[11],h=t[12],g=t[13],_=t[14],v=t[15],y=n[0],b=n[1],x=n[2],S=n[3];return e[0]=y*r+b*s+x*d+S*h,e[1]=y*i+b*c+x*f+S*g,e[2]=y*a+b*l+x*p+S*_,e[3]=y*o+b*u+x*m+S*v,y=n[4],b=n[5],x=n[6],S=n[7],e[4]=y*r+b*s+x*d+S*h,e[5]=y*i+b*c+x*f+S*g,e[6]=y*a+b*l+x*p+S*_,e[7]=y*o+b*u+x*m+S*v,y=n[8],b=n[9],x=n[10],S=n[11],e[8]=y*r+b*s+x*d+S*h,e[9]=y*i+b*c+x*f+S*g,e[10]=y*a+b*l+x*p+S*_,e[11]=y*o+b*u+x*m+S*v,y=n[12],b=n[13],x=n[14],S=n[15],e[12]=y*r+b*s+x*d+S*h,e[13]=y*i+b*c+x*f+S*g,e[14]=y*a+b*l+x*p+S*_,e[15]=y*o+b*u+x*m+S*v,e}function i(e,t,n,r,i){var a=1/Math.tan(t/2);if(e[0]=a/n,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=a,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,i!=null&&i!==1/0){var o=1/(r-i);e[10]=i*o,e[14]=i*r*o}else e[10]=-1,e[14]=-r;return e}function a(e,t,r,i){var a,o,s,c,l,u,d,f,p,m,h=t[0],g=t[1],_=t[2],v=i[0],y=i[1],b=i[2],x=r[0],S=r[1],C=r[2];return Math.abs(h-x)<1e-6&&Math.abs(g-S)<1e-6&&Math.abs(_-C)<1e-6?n(e):(d=h-x,f=g-S,p=_-C,m=1/Math.sqrt(d*d+f*f+p*p),d*=m,f*=m,p*=m,a=y*p-b*f,o=b*d-v*p,s=v*f-y*d,m=Math.sqrt(a*a+o*o+s*s),m?(m=1/m,a*=m,o*=m,s*=m):(a=0,o=0,s=0),c=f*s-p*o,l=p*a-d*s,u=d*o-f*a,m=Math.sqrt(c*c+l*l+u*u),m?(m=1/m,c*=m,l*=m,u*=m):(c=0,l=0,u=0),e[0]=a,e[1]=c,e[2]=d,e[3]=0,e[4]=o,e[5]=l,e[6]=f,e[7]=0,e[8]=s,e[9]=u,e[10]=p,e[11]=0,e[12]=-(a*h+o*g+s*_),e[13]=-(c*h+l*g+u*_),e[14]=-(d*h+f*g+p*_),e[15]=1,e)}function o(){var t=new e(3);return e!=Float32Array&&(t[0]=0,t[1]=0,t[2]=0),t}function s(t,n,r){var i=new e(3);return i[0]=t,i[1]=n,i[2]=r,i}function c(e,t,n,r){return e[0]=t,e[1]=n,e[2]=r,e}function l(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e[2]=t[2]+n[2],e}function u(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e[2]=t[2]-n[2],e}function d(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e[2]=t[2]*n,e}function f(e,t){var n=t[0],r=t[1],i=t[2],a=n*n+r*r+i*i;return a>0&&(a=1/Math.sqrt(a)),e[0]=t[0]*a,e[1]=t[1]*a,e[2]=t[2]*a,e}function p(e,t,n){var r=t[0],i=t[1],a=t[2],o=n[0],s=n[1],c=n[2];return e[0]=i*c-a*s,e[1]=a*o-r*c,e[2]=r*s-i*o,e}(function(){var e=o();return function(t,n,r,i,a,o){var s,c;for(n||=3,r||=0,c=i?Math.min(i*n+r,t.length):t.length,s=r;s<c;s+=n)e[0]=t[s],e[1]=t[s+1],e[2]=t[s+2],a(e,e,o),t[s]=e[0],t[s+1]=e[1],t[s+2]=e[2];return t}})();var m=class e{constructor(t,n,r,i,a=`div`){this.parent=t,this.object=n,this.property=r,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(a),this.domElement.classList.add(`lil-controller`),this.domElement.classList.add(i),this.$name=document.createElement(`div`),this.$name.classList.add(`lil-name`),e.nextNameID=e.nextNameID||0,this.$name.id=`lil-gui-name-${++e.nextNameID}`,this.$widget=document.createElement(`div`),this.$widget.classList.add(`lil-widget`),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener(`keydown`,e=>e.stopPropagation()),this.domElement.addEventListener(`keyup`,e=>e.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(r)}name(e){return this._name=e,this.$name.textContent=e,this}onChange(e){return this._onChange=e,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(e=!0){return this.disable(!e)}disable(e=!0){return e===this._disabled?this:(this._disabled=e,this.domElement.classList.toggle(`lil-disabled`,e),this.$disable.toggleAttribute(`disabled`,e),this)}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?`none`:``,this}hide(){return this.show(!1)}options(e){let t=this.parent.add(this.object,this.property,e);return t.name(this._name),this.destroy(),t}min(e){return this}max(e){return this}step(e){return this}decimals(e){return this}listen(e=!0){return this._listening=e,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);let e=this.save();e!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=e}getValue(){return this.object[this.property]}setValue(e){return this.getValue()!==e&&(this.object[this.property]=e,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(e){return this.setValue(e),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}},h=class extends m{constructor(e,t,n){super(e,t,n,`lil-boolean`,`label`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`checkbox`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener(`change`,()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}};function g(e){let t,n;return(t=e.match(/(#|0x)?([a-f0-9]{6})/i))?n=t[2]:(t=e.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?n=parseInt(t[1]).toString(16).padStart(2,0)+parseInt(t[2]).toString(16).padStart(2,0)+parseInt(t[3]).toString(16).padStart(2,0):(t=e.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(n=t[1]+t[1]+t[2]+t[2]+t[3]+t[3]),n?`#`+n:!1}var _={isPrimitive:!0,match:e=>typeof e==`string`,fromHexString:g,toHexString:g},v={isPrimitive:!0,match:e=>typeof e==`number`,fromHexString:e=>parseInt(e.substring(1),16),toHexString:e=>`#`+e.toString(16).padStart(6,0)},y=[_,v,{isPrimitive:!1,match:e=>Array.isArray(e)||ArrayBuffer.isView(e),fromHexString(e,t,n=1){let r=v.fromHexString(e);t[0]=(r>>16&255)/255*n,t[1]=(r>>8&255)/255*n,t[2]=(r&255)/255*n},toHexString([e,t,n],r=1){r=255/r;let i=e*r<<16^t*r<<8^n*r<<0;return v.toHexString(i)}},{isPrimitive:!1,match:e=>Object(e)===e,fromHexString(e,t,n=1){let r=v.fromHexString(e);t.r=(r>>16&255)/255*n,t.g=(r>>8&255)/255*n,t.b=(r&255)/255*n},toHexString({r:e,g:t,b:n},r=1){r=255/r;let i=e*r<<16^t*r<<8^n*r<<0;return v.toHexString(i)}}];function b(e){return y.find(t=>t.match(e))}var x=class extends m{constructor(e,t,n,r){super(e,t,n,`lil-color`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`color`),this.$input.setAttribute(`tabindex`,-1),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$text=document.createElement(`input`),this.$text.setAttribute(`type`,`text`),this.$text.setAttribute(`spellcheck`,`false`),this.$text.setAttribute(`aria-labelledby`,this.$name.id),this.$display=document.createElement(`div`),this.$display.classList.add(`lil-display`),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=b(this.initialValue),this._rgbScale=r,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener(`input`,()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener(`blur`,()=>{this._callOnFinishChange()}),this.$text.addEventListener(`input`,()=>{let e=g(this.$text.value);e&&this._setValueFromHexString(e)}),this.$text.addEventListener(`focus`,()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener(`blur`,()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(e){if(this._format.isPrimitive){let t=this._format.fromHexString(e);this.setValue(t)}else this._format.fromHexString(e,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(e){return this._setValueFromHexString(e),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}},S=class extends m{constructor(e,t,n){super(e,t,n,`lil-function`),this.$button=document.createElement(`button`),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener(`click`,e=>{e.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener(`touchstart`,()=>{},{passive:!0}),this.$disable=this.$button}},C=class extends m{constructor(e,t,n,r,i,a){super(e,t,n,`lil-number`),this._initInput(),this.min(r),this.max(i);let o=a!==void 0;this.step(o?a:this._getImplicitStep(),o),this.updateDisplay()}decimals(e){return this._decimals=e,this.updateDisplay(),this}min(e){return this._min=e,this._onUpdateMinMax(),this}max(e){return this._max=e,this._onUpdateMinMax(),this}step(e,t=!0){return this._step=e,this._stepExplicit=t,this}updateDisplay(){let e=this.getValue();if(this._hasSlider){let t=(e-this._min)/(this._max-this._min);t=Math.max(0,Math.min(t,1)),this.$fill.style.width=t*100+`%`}return this._inputFocused||(this.$input.value=this._decimals===void 0?e:e.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`text`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),window.matchMedia(`(pointer: coarse)`).matches&&(this.$input.setAttribute(`type`,`number`),this.$input.setAttribute(`step`,`any`)),this.$widget.appendChild(this.$input),this.$disable=this.$input;let e=()=>{let e=parseFloat(this.$input.value);isNaN(e)||(this._stepExplicit&&(e=this._snap(e)),this.setValue(this._clamp(e)))},t=e=>{let t=parseFloat(this.$input.value);isNaN(t)||(this._snapClampSetValue(t+e),this.$input.value=this.getValue())},n=e=>{e.key===`Enter`&&this.$input.blur(),e.code===`ArrowUp`&&(e.preventDefault(),t(this._step*this._arrowKeyMultiplier(e))),e.code===`ArrowDown`&&(e.preventDefault(),t(this._step*this._arrowKeyMultiplier(e)*-1))},r=e=>{this._inputFocused&&(e.preventDefault(),t(this._step*this._normalizeMouseWheel(e)))},i=!1,a,o,s,c,l,u=e=>{a=e.clientX,o=s=e.clientY,i=!0,c=this.getValue(),l=0,window.addEventListener(`mousemove`,d),window.addEventListener(`mouseup`,f)},d=e=>{if(i){let t=e.clientX-a,n=e.clientY-o;Math.abs(n)>5?(e.preventDefault(),this.$input.blur(),i=!1,this._setDraggingStyle(!0,`vertical`)):Math.abs(t)>5&&f()}if(!i){let t=e.clientY-s;l-=t*this._step*this._arrowKeyMultiplier(e),c+l>this._max?l=this._max-c:c+l<this._min&&(l=this._min-c),this._snapClampSetValue(c+l)}s=e.clientY},f=()=>{this._setDraggingStyle(!1,`vertical`),this._callOnFinishChange(),window.removeEventListener(`mousemove`,d),window.removeEventListener(`mouseup`,f)};this.$input.addEventListener(`input`,e),this.$input.addEventListener(`keydown`,n),this.$input.addEventListener(`wheel`,r,{passive:!1}),this.$input.addEventListener(`mousedown`,u),this.$input.addEventListener(`focus`,()=>{this._inputFocused=!0}),this.$input.addEventListener(`blur`,()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()})}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement(`div`),this.$slider.classList.add(`lil-slider`),this.$fill=document.createElement(`div`),this.$fill.classList.add(`lil-fill`),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add(`lil-has-slider`);let e=(e,t,n,r,i)=>(e-t)/(n-t)*(i-r)+r,t=t=>{let n=this.$slider.getBoundingClientRect(),r=e(t,n.left,n.right,this._min,this._max);this._snapClampSetValue(r)},n=e=>{this._setDraggingStyle(!0),t(e.clientX),window.addEventListener(`mousemove`,r),window.addEventListener(`mouseup`,i)},r=e=>{t(e.clientX)},i=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener(`mousemove`,r),window.removeEventListener(`mouseup`,i)},a=!1,o,s,c=e=>{e.preventDefault(),this._setDraggingStyle(!0),t(e.touches[0].clientX),a=!1},l=e=>{e.touches.length>1||(this._hasScrollBar?(o=e.touches[0].clientX,s=e.touches[0].clientY,a=!0):c(e),window.addEventListener(`touchmove`,u,{passive:!1}),window.addEventListener(`touchend`,d))},u=e=>{if(a){let t=e.touches[0].clientX-o,n=e.touches[0].clientY-s;Math.abs(t)>Math.abs(n)?c(e):(window.removeEventListener(`touchmove`,u),window.removeEventListener(`touchend`,d))}else e.preventDefault(),t(e.touches[0].clientX)},d=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener(`touchmove`,u),window.removeEventListener(`touchend`,d)},f=this._callOnFinishChange.bind(this),p;this.$slider.addEventListener(`mousedown`,n),this.$slider.addEventListener(`touchstart`,l,{passive:!1}),this.$slider.addEventListener(`wheel`,e=>{if(Math.abs(e.deltaX)<Math.abs(e.deltaY)&&this._hasScrollBar)return;e.preventDefault();let t=this._normalizeMouseWheel(e)*this._step;this._snapClampSetValue(this.getValue()+t),this.$input.value=this.getValue(),clearTimeout(p),p=setTimeout(f,400)},{passive:!1})}_setDraggingStyle(e,t=`horizontal`){this.$slider&&this.$slider.classList.toggle(`lil-active`,e),document.body.classList.toggle(`lil-dragging`,e),document.body.classList.toggle(`lil-${t}`,e)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(e){let{deltaX:t,deltaY:n}=e;return Math.floor(e.deltaY)!==e.deltaY&&e.wheelDelta&&(t=0,n=-e.wheelDelta/120,n*=this._stepExplicit?1:10),t+-n}_arrowKeyMultiplier(e){let t=this._stepExplicit?1:10;return e.shiftKey?t*=10:e.altKey&&(t/=10),t}_snap(e){let t=0;return this._hasMin?t=this._min:this._hasMax&&(t=this._max),e-=t,e=Math.round(e/this._step)*this._step,e+=t,e=parseFloat(e.toPrecision(15)),e}_clamp(e){return e<this._min&&(e=this._min),e>this._max&&(e=this._max),e}_snapClampSetValue(e){this.setValue(this._clamp(this._snap(e)))}get _hasScrollBar(){let e=this.parent.root.$children;return e.scrollHeight>e.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}},w=class extends m{constructor(e,t,n,r){super(e,t,n,`lil-option`),this.$select=document.createElement(`select`),this.$select.setAttribute(`aria-labelledby`,this.$name.id),this.$display=document.createElement(`div`),this.$display.classList.add(`lil-display`),this.$select.addEventListener(`change`,()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener(`focus`,()=>{this.$display.classList.add(`lil-focus`)}),this.$select.addEventListener(`blur`,()=>{this.$display.classList.remove(`lil-focus`)}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(r)}options(e){return this._values=Array.isArray(e)?e:Object.values(e),this._names=Array.isArray(e)?e:Object.keys(e),this.$select.replaceChildren(),this._names.forEach(e=>{let t=document.createElement(`option`);t.textContent=e,this.$select.appendChild(t)}),this.updateDisplay(),this}updateDisplay(){let e=this.getValue(),t=this._values.indexOf(e);return this.$select.selectedIndex=t,this.$display.textContent=t===-1?e:this._names[t],this}},T=class extends m{constructor(e,t,n){super(e,t,n,`lil-string`),this.$input=document.createElement(`input`),this.$input.setAttribute(`type`,`text`),this.$input.setAttribute(`spellcheck`,`false`),this.$input.setAttribute(`aria-labelledby`,this.$name.id),this.$input.addEventListener(`input`,()=>{this.setValue(this.$input.value)}),this.$input.addEventListener(`keydown`,e=>{e.code===`Enter`&&this.$input.blur()}),this.$input.addEventListener(`blur`,()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}},E=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.lil-root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.lil-root > .lil-children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.lil-allow-touch-styles, .lil-gui.lil-allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.lil-force-touch-styles, .lil-gui.lil-force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.lil-auto-place, .lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-controller.lil-disabled {
  opacity: 0.5;
}
.lil-controller.lil-disabled, .lil-controller.lil-disabled * {
  pointer-events: none !important;
}
.lil-controller > .lil-name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-controller .lil-widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-controller.lil-string input {
  color: var(--string-color);
}
.lil-controller.lil-boolean {
  cursor: pointer;
}
.lil-controller.lil-color .lil-display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-controller.lil-color .lil-display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-controller.lil-color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-controller.lil-color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-controller.lil-option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-controller.lil-option .lil-display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-display.lil-focus {
    background: var(--focus-color);
  }
}
.lil-controller.lil-option .lil-display.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-option .lil-display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-controller.lil-option .lil-widget,
.lil-controller.lil-option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-widget:hover .lil-display {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number input {
  color: var(--number-color);
}
.lil-controller.lil-number.lil-has-slider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-controller.lil-number .lil-slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-controller.lil-number .lil-slider:hover {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number .lil-slider.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-number .lil-slider.lil-active .lil-fill {
  opacity: 0.95;
}
.lil-controller.lil-number .lil-fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-dragging * {
  cursor: ew-resize !important;
}
.lil-dragging.lil-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .lil-title {
  height: var(--title-height);
  font-weight: 600;
  padding: 0 var(--padding);
  width: 100%;
  text-align: left;
  background: none;
  text-decoration-skip: objects;
}
.lil-gui .lil-title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .lil-title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-dragging) .lil-gui .lil-title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .lil-title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.lil-root > .lil-title:focus {
  text-decoration: none !important;
}
.lil-gui.lil-closed > .lil-title:before {
  content: "▸";
}
.lil-gui.lil-closed > .lil-children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.lil-closed:not(.lil-transition) > .lil-children {
  display: none;
}
.lil-gui.lil-transition > .lil-children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .lil-children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.lil-root > .lil-children > .lil-gui > .lil-title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.lil-root > .lil-children > .lil-gui.lil-closed > .lil-title {
  border-bottom-color: transparent;
}
.lil-gui + .lil-controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .lil-title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .lil-children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .lil-controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  border: none;
}
.lil-gui .lil-controller button {
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
}
@media (hover: hover) {
  .lil-gui .lil-controller button:hover {
    background: var(--hover-color);
  }
  .lil-gui .lil-controller button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui .lil-controller button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAALkAAsAAAAABtQAAAKVAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACDMgqBBIEbATYCJAMUCwwABCAFhAoHgQQbHAbIDiUFEYVARAAAYQTVWNmz9MxhEgodq49wYRUFKE8GWNiUBxI2LBRaVnc51U83Gmhs0Q7JXWMiz5eteLwrKwuxHO8VFxUX9UpZBs6pa5ABRwHA+t3UxUnH20EvVknRerzQgX6xC/GH6ZUvTcAjAv122dF28OTqCXrPuyaDER30YBA1xnkVutDDo4oCi71Ca7rrV9xS8dZHbPHefsuwIyCpmT7j+MnjAH5X3984UZoFFuJ0yiZ4XEJFxjagEBeqs+e1iyK8Xf/nOuwF+vVK0ur765+vf7txotUi0m3N0m/84RGSrBCNrh8Ee5GjODjF4gnWP+dJrH/Lk9k4oT6d+gr6g/wssA2j64JJGP6cmx554vUZnpZfn6ZfX2bMwPPrlANsB86/DiHjhl0OP+c87+gaJo/gY084s3HoYL/ZkWHTRfBXvvoHnnkHvngKun4KBE/ede7tvq3/vQOxDXB1/fdNz6XbPdcr0Vhpojj9dG+owuSKFsslCi1tgEjirjXdwMiov2EioadxmqTHUCIwo8NgQaeIasAi0fTYSPTbSmwbMOFduyh9wvBrESGY0MtgRjtgQR8Q1bRPohn2UoCRZf9wyYANMXFeJTysqAe0I4mrherOekFdKMrYvJjLvOIUM9SuwYB5DVZUwwVjJJOaUnZCmcEkIZZrKqNvRGRMvmFZsmhP4VMKCSXBhSqUBxgMS7h0cZvEd71AWkEhGWaeMFcNnpqyJkyXgYL7PQ1MoSq0wDAkRtJIijkZSmqYTiSImfLiSWXIZwhRh3Rug2X0kk1Dgj+Iu43u5p98ghopcpSo0Uyc8SnjlYX59WUeaMoDqmVD2TOWD9a4pCRAzf2ECgwGcrHjPOWY9bNxq/OL3I/QjwEAAAA=") format("woff2");
}`;function D(e){let t=document.createElement(`style`);t.innerHTML=e;let n=document.querySelector(`head link[rel=stylesheet], head style`);n?document.head.insertBefore(t,n):document.head.appendChild(t)}var O=!1,k=class e{constructor({parent:e,autoPlace:t=e===void 0,container:n,width:r,title:i=`Controls`,closeFolders:a=!1,injectStyles:o=!0,touchStyles:s=!0}={}){if(this.parent=e,this.root=e?e.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement(`div`),this.domElement.classList.add(`lil-gui`),this.$title=document.createElement(`button`),this.$title.classList.add(`lil-title`),this.$title.setAttribute(`aria-expanded`,!0),this.$title.addEventListener(`click`,()=>this.openAnimated(this._closed)),this.$title.addEventListener(`touchstart`,()=>{},{passive:!0}),this.$children=document.createElement(`div`),this.$children.classList.add(`lil-children`),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(i),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add(`lil-root`),s&&this.domElement.classList.add(`lil-allow-touch-styles`),!O&&o&&(D(E),O=!0),n?n.appendChild(this.domElement):t&&(this.domElement.classList.add(`lil-auto-place`,`autoPlace`),document.body.appendChild(this.domElement)),r&&this.domElement.style.setProperty(`--width`,r+`px`),this._closeFolders=a}add(e,t,n,r,i){if(Object(n)===n)return new w(this,e,t,n);let a=e[t];switch(typeof a){case`number`:return new C(this,e,t,n,r,i);case`boolean`:return new h(this,e,t);case`string`:return new T(this,e,t);case`function`:return new S(this,e,t)}console.error(`gui.add failed
	property:`,t,`
	object:`,e,`
	value:`,a)}addColor(e,t,n=1){return new x(this,e,t,n)}addFolder(t){let n=new e({parent:this,title:t});return this.root._closeFolders&&n.close(),n}load(e,t=!0){return e.controllers&&this.controllers.forEach(t=>{t instanceof S||t._name in e.controllers&&t.load(e.controllers[t._name])}),t&&e.folders&&this.folders.forEach(t=>{t._title in e.folders&&t.load(e.folders[t._title])}),this}save(e=!0){let t={controllers:{},folders:{}};return this.controllers.forEach(e=>{if(!(e instanceof S)){if(e._name in t.controllers)throw Error(`Cannot save GUI with duplicate property "${e._name}"`);t.controllers[e._name]=e.save()}}),e&&this.folders.forEach(e=>{if(e._title in t.folders)throw Error(`Cannot save GUI with duplicate folder "${e._title}"`);t.folders[e._title]=e.save()}),t}open(e=!0){return this._setClosed(!e),this.$title.setAttribute(`aria-expanded`,!this._closed),this.domElement.classList.toggle(`lil-closed`,this._closed),this}close(){return this.open(!1)}_setClosed(e){this._closed!==e&&(this._closed=e,this._callOnOpenClose(this))}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?`none`:``,this}hide(){return this.show(!1)}openAnimated(e=!0){return this._setClosed(!e),this.$title.setAttribute(`aria-expanded`,!this._closed),requestAnimationFrame(()=>{let t=this.$children.clientHeight;this.$children.style.height=t+`px`,this.domElement.classList.add(`lil-transition`);let n=e=>{e.target===this.$children&&(this.$children.style.height=``,this.domElement.classList.remove(`lil-transition`),this.$children.removeEventListener(`transitionend`,n))};this.$children.addEventListener(`transitionend`,n);let r=e?this.$children.scrollHeight:0;this.domElement.classList.toggle(`lil-closed`,!e),requestAnimationFrame(()=>{this.$children.style.height=r+`px`})}),this}title(e){return this._title=e,this.$title.textContent=e,this}reset(e=!0){return(e?this.controllersRecursive():this.controllers).forEach(e=>e.reset()),this}onChange(e){return this._onChange=e,this}_callOnChange(e){this.parent&&this.parent._callOnChange(e),this._onChange!==void 0&&this._onChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(e){this.parent&&this.parent._callOnFinishChange(e),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onOpenClose(e){return this._onOpenClose=e,this}_callOnOpenClose(e){this.parent&&this.parent._callOnOpenClose(e),this._onOpenClose!==void 0&&this._onOpenClose.call(this,e)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(e=>e.destroy())}controllersRecursive(){let e=Array.from(this.controllers);return this.folders.forEach(t=>{e=e.concat(t.controllersRecursive())}),e}foldersRecursive(){let e=Array.from(this.folders);return this.folders.forEach(t=>{e=e.concat(t.foldersRecursive())}),e}},A=class{viewMatrix;eye;target;up;radius;theta;phi;initialRadius;isDragging=!1;isPanning=!1;lastX=0;lastY=0;canvas;sensitivity=.005;zoomSpeed=.001;minDistance=2;maxDistance=2e6;constructor(e,n=60){this.canvas=e,this.viewMatrix=t(),this.eye=o(),this.target=s(0,0,0),this.up=s(0,1,0),this.initialRadius=n,this.radius=n,this.theta=Math.PI/2,this.phi=Math.PI/3,this.bindEvents(),this.updateMatrix()}reset(){c(this.target,0,0,0),this.radius=this.initialRadius,this.theta=Math.PI/2,this.phi=Math.PI/3,this.updateMatrix()}getCameraBasis(){let e=o();u(e,this.target,this.eye),f(e,e);let t=o();p(t,e,this.up),f(t,t);let n=o();return p(n,t,e),f(n,n),{forward:e,right:t,camUp:n}}bindEvents(){this.canvas.addEventListener(`contextmenu`,e=>e.preventDefault()),window.addEventListener(`keydown`,e=>{e.code===`Space`&&this.reset()}),this.canvas.addEventListener(`pointerdown`,e=>{this.lastX=e.clientX,this.lastY=e.clientY,this.canvas.setPointerCapture(e.pointerId),e.button===0?this.isPanning=!0:e.button===2&&(this.isDragging=!0)}),this.canvas.addEventListener(`pointermove`,e=>{if(!this.isDragging&&!this.isPanning)return;let t=e.clientX-this.lastX,n=e.clientY-this.lastY;if(this.lastX=e.clientX,this.lastY=e.clientY,this.isDragging){this.theta+=t*this.sensitivity,this.phi-=n*this.sensitivity;let e=.01;this.phi=Math.max(e,Math.min(Math.PI-e,this.phi))}if(this.isPanning){let{right:e,camUp:r}=this.getCameraBasis(),i=this.radius*.0015,a=o(),s=o();d(a,e,-t*i),d(s,r,n*i),l(this.target,this.target,a),l(this.target,this.target,s)}this.updateMatrix()}),this.canvas.addEventListener(`pointerup`,e=>{this.isDragging=!1,this.isPanning=!1,this.canvas.releasePointerCapture(e.pointerId)}),this.canvas.addEventListener(`wheel`,e=>{e.preventDefault();let t=this.radius,n=t+e.deltaY*this.zoomSpeed*t;n=Math.max(this.minDistance,Math.min(this.maxDistance,n));let r=this.canvas.getBoundingClientRect(),i=(e.clientX-r.left)/r.width*2-1,a=-((e.clientY-r.top)/r.height*2-1),s=2*Math.PI/5,c=r.width/r.height,u=t*Math.tan(s/2),f=u*c,p=(t-n)/t,{right:m,camUp:h}=this.getCameraBasis(),g=o(),_=o();d(g,m,i*f*p),d(_,h,a*u*p),l(this.target,this.target,g),l(this.target,this.target,_),this.radius=n,this.updateMatrix()},{passive:!1})}updateMatrix(){let e=Math.sin(this.phi),t=Math.cos(this.phi),n=Math.sin(this.theta),r=Math.cos(this.theta),i=this.radius*e*r,o=this.radius*t,s=this.radius*e*n;c(this.eye,this.target[0]+i,this.target[1]+o,this.target[2]+s),a(this.viewMatrix,this.eye,this.target,this.up)}},j=`struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>,
  rotationTime: f32,
  ambientStrength: f32,
  padding: f32,
  focusPos: vec3<f32>, // Offset 80
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var mySampler: sampler;
@group(0) @binding(2) var myTexture: texture_2d_array<f32>;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) WorldPos: vec3<f32>,
  @location(1) Normal: vec3<f32>,
  @location(2) Uv: vec2<f32>,
  @location(3) TexIndex: f32,
  @location(4) Color: vec3<f32>,
  @location(5) SunRelativePos: vec3<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>, 
  @location(1) normal: vec3<f32>, 
  @location(2) uv: vec2<f32>, 
  // Instance Attributes
  @location(3) i_radius: f32, 
  @location(4) i_distance: f32, 
  @location(5) i_relX: f32, // 这里我们不再用CPU传过来的relX，而是用 distance 重新算
  @location(6) i_relZ: f32,
  @location(7) i_color: vec3<f32>,
  @location(8) i_texIndex: f32,
  // Unused here, but needed for shared buffer layout
  @location(9) i_orbitCenterX: f32,
  @location(10) i_orbitCenterZ: f32
) -> VertexOutput {
  var output: VertexOutput;

  // 既然我们有了 focusPos Uniform，我们可以在 Shader 里直接用 i_distance 算绝对坐标
  // 这样星球和轨道共用同一套 "Radius/Distance" 逻辑，不会出现分离

  // 1. 自转
  let rotSpeed = 0.5;
  var rAngle = 0.0;
  if (i_radius > 0.0) {
    rAngle = -1.0 * uniforms.rotationTime * rotSpeed;
  }
  let c = cos(rAngle);
  let s = sin(rAngle);
  let rotatedPos = vec3<f32>(position.x * c - position.z * s, position.y, position.x * s + position.z * c);
  let rotatedNormal = vec3<f32>(normal.x * c - normal.z * s, normal.y, normal.x * s + normal.z * c);

  // 2. 利用传入的 i_relX / i_relZ (这是相对于太阳的位置)
  // 注意：在 main.ts 里，我们将把 "相对于太阳的位置" 传进 relX/relZ
  // 而不是相对于 Focus 的位置。这样更灵活。
  let planetPosRelativeToSun = vec3<f32>(i_relX, 0.0, i_relZ);
  
  // 3. 太阳相对于 Focus 的位置
  let sunRelativePos = -uniforms.focusPos;

  // 4. 最终坐标 = (本地旋转 * 半径) + 行星相对太阳位移 + 太阳相对Focus位移
  let finalRelPos = (rotatedPos * i_radius) + planetPosRelativeToSun + sunRelativePos;
  let sunRelativeWorldPos = (rotatedPos * i_radius) + planetPosRelativeToSun;

  output.Position = uniforms.viewProjectionMatrix * vec4<f32>(finalRelPos, 1.0);
  output.WorldPos = finalRelPos;
  output.SunRelativePos = sunRelativeWorldPos;
  output.Normal = rotatedNormal;
  output.Uv = uv;
  output.TexIndex = i_texIndex;
  output.Color = i_color;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let N = normalize(input.Normal);
  // Correct lighting: Light source is always the Sun (0,0,0)
  let L = normalize(-input.SunRelativePos); 
  var diffuse = max(dot(N, L), 0.0);
  var ambient = vec3<f32>(0.30, 0.30, 0.35) * uniforms.ambientStrength;

  // Sun is emissive
  if (input.TexIndex < 0.1) {
    diffuse = 1.0;
    ambient = vec3<f32>(0.0);
  }

  let texColor = textureSample(myTexture, mySampler, input.Uv, i32(input.TexIndex));
  let lighting = vec3<f32>(diffuse) + ambient;
  let finalColor = texColor.rgb * lighting * input.Color;

  return vec4<f32>(finalColor, 1.0);
}`,M=`struct Uniforms {
  viewProjectionMatrix: mat4x4<f32>,
  padding1: f32, // 占位: rotationTime
  ambientStrength: f32,
  // 必须与 main.ts 里的 Uniform Buffer 结构对齐
  // offset 76 (padding)
  // offset 80 (focusPos)
  padding2: f32,
  focusPos: vec3<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
}

@vertex
fn vs_main(
  @location(0) position: vec3<f32>,
  @location(4) i_orbitRadius: f32,
  // locations 5,6,7,8 are used by the main shader
  @location(9) i_orbitCenterX: f32,
  @location(10) i_orbitCenterZ: f32
) -> VertexOutput {
  var output: VertexOutput;

  // 1. 太阳在绝对空间的位置是 (0,0,0)
  // 2. 我们现在的世界原点是 focusPos
  // 3. 所以太阳相对于我们的位置是 -focusPos
  let sunRelativePos = -uniforms.focusPos;
  let orbitCenter = vec3<f32>(i_orbitCenterX, 0.0, i_orbitCenterZ);

  // 轨道的顶点位置 = (单位圆 * 半径) + 轨道中心位置(相对太阳) + 太阳相对Focus的位置
  let worldPos = (position * i_orbitRadius) + orbitCenter + sunRelativePos;

  output.Position = uniforms.viewProjectionMatrix * vec4<f32>(worldPos, 1.0);
  return output;
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  // 增加基础亮度，让线更明显
  let baseAlpha = 0.3;
  let alpha = clamp(baseAlpha * uniforms.ambientStrength, 0.0, 1.0);
  return vec4<f32>(1.0, 1.0, 1.0, alpha);
}`;const N=23455,P=[{name:`Sun`,artisticRadius:3,artisticDistance:0,realRadius:109,realDistance:0,speed:0,color:[1,1,.8],texIndex:0,initialAngle:0},{name:`Mercury`,artisticRadius:.38,artisticDistance:6,realRadius:.38,realDistance:.39,speed:4.1,color:[1,1,1],texIndex:1,initialAngle:Math.random()*6},{name:`Venus`,artisticRadius:.95,artisticDistance:10,realRadius:.95,realDistance:.72,speed:1.6,color:[1,1,1],texIndex:2,initialAngle:Math.random()*6},{name:`Earth`,artisticRadius:1,artisticDistance:15,realRadius:1,realDistance:1,speed:1,color:[1,1,1],texIndex:3,initialAngle:Math.random()*6},{name:`Mars`,artisticRadius:.53,artisticDistance:20,realRadius:.53,realDistance:1.52,speed:.53,color:[1,1,1],texIndex:4,initialAngle:Math.random()*6},{name:`Jupiter`,artisticRadius:2.2,artisticDistance:28,realRadius:11.2,realDistance:5.2,speed:.3,color:[1,1,1],texIndex:5,initialAngle:Math.random()*6},{name:`Saturn`,artisticRadius:2,artisticDistance:36,realRadius:9.45,realDistance:9.54,speed:.2,color:[1,1,1],texIndex:6,initialAngle:Math.random()*6},{name:`Uranus`,artisticRadius:1.5,artisticDistance:44,realRadius:4,realDistance:19.2,speed:.1,color:[1,1,1],texIndex:7,initialAngle:Math.random()*6},{name:`Neptune`,artisticRadius:1.4,artisticDistance:52,realRadius:3.88,realDistance:30.06,speed:.1,color:[1,1,1],texIndex:8,initialAngle:Math.random()*6},{name:`Moon`,artisticRadius:.2,artisticDistance:2,realRadius:.27,realDistance:.00257,speed:12,color:[1,1,1],texIndex:9,initialAngle:Math.random()*6,parentName:`Earth`}],F=P.map(e=>`${e.name}.jpg`);function I(e,t=64,n=32){let r=[],i=[];for(let i=0;i<=n;i++){let a=i/n,o=(a-.5)*Math.PI,s=Math.cos(o),c=Math.sin(o);for(let n=0;n<=t;n++){let i=n/t,o=i*2*Math.PI,l=Math.cos(o),u=Math.sin(o);r.push(e*l*s,e*c,e*u*s),r.push(l*s,c,u*s),r.push(1-i,1-a)}}let a=t+1;for(let e=0;e<n;e++)for(let n=0;n<t;n++){let t=e*a+n,r=t+1,o=(e+1)*a+n,s=o+1;i.push(t,o,r),i.push(o,s,r)}return{vertexData:new Float32Array(r),indexData:new Uint16Array(i),indexCount:i.length}}async function L(e){let t=2048,n=1024;try{let r=await fetch(e);if(!r.ok)throw Error(`Network error`);let i=await r.blob(),a=await createImageBitmap(i),o=document.createElement(`canvas`);return o.width=t,o.height=n,o.getContext(`2d`).drawImage(a,0,0,t,n),createImageBitmap(o)}catch{console.warn(`Texture load failed: ${e}`);let r=document.createElement(`canvas`);r.width=t,r.height=n;let i=r.getContext(`2d`);return i.fillStyle=`#222`,i.fillRect(0,0,t,n),i.fillStyle=`white`,i.font=`bold 100px Arial`,i.textAlign=`center`,i.textBaseline=`middle`,i.fillText(e.replace(`.jpg`,``),t/2,n/2),createImageBitmap(r)}}function R(e=256,t=.5){let n=[],r=Math.PI*2/e;for(let i=0;i<e;i++){let e=i*r,a=e+r*t;n.push(Math.cos(e),0,Math.sin(e)),n.push(Math.cos(a),0,Math.sin(a))}return new Float32Array(n)}async function z(){let e=document.querySelector(`#app`);if(e.width=window.innerWidth*window.devicePixelRatio,e.height=window.innerHeight*window.devicePixelRatio,e.style.width=`100vw`,e.style.height=`100vh`,!navigator.gpu)throw Error(`WebGPU not supported`);let n=await(await navigator.gpu.requestAdapter()).requestDevice(),a=e.getContext(`webgpu`),o=navigator.gpu.getPreferredCanvasFormat();a.configure({device:n,format:o,alphaMode:`premultiplied`});let s=new A(e,80);s.maxDistance=2e6;let c={pauseOrbit:!1,pauseRotation:!1,focusTarget:`Sun`,timeScale:1,trueScale:!1,valSizeScale:1,valDistScale:1,brightMode:!1,hideSun:!1},l=await Promise.all(F.map(e=>L(e))),u=n.createTexture({size:[2048,1024,F.length],format:`rgba8unorm`,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});l.forEach((e,t)=>{n.queue.copyExternalImageToTexture({source:e},{texture:u,origin:[0,0,t]},[2048,1024])});let d=n.createSampler({magFilter:`linear`,minFilter:`linear`,addressModeU:`repeat`,addressModeV:`clamp-to-edge`}),f=I(1),p=n.createBuffer({size:f.vertexData.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(p.getMappedRange()).set(f.vertexData),p.unmap();let m=n.createBuffer({size:f.indexData.byteLength,usage:GPUBufferUsage.INDEX,mappedAtCreation:!0});new Uint16Array(m.getMappedRange()).set(f.indexData),m.unmap();let h=R(512,.6),g=n.createBuffer({size:h.byteLength,usage:GPUBufferUsage.VERTEX,mappedAtCreation:!0});new Float32Array(g.getMappedRange()).set(h),g.unmap();let _=new Float32Array(P.length*10),v=n.createBuffer({size:_.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST}),y=n.createBuffer({size:96,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST}),b=[{shaderLocation:3,offset:0,format:`float32`},{shaderLocation:4,offset:4,format:`float32`},{shaderLocation:5,offset:8,format:`float32`},{shaderLocation:6,offset:12,format:`float32`},{shaderLocation:7,offset:16,format:`float32x3`},{shaderLocation:8,offset:28,format:`float32`},{shaderLocation:9,offset:32,format:`float32`},{shaderLocation:10,offset:36,format:`float32`}],x=n.createShaderModule({code:j}),S=n.createRenderPipeline({layout:`auto`,vertex:{module:x,entryPoint:`vs_main`,buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:`float32x3`},{shaderLocation:1,offset:12,format:`float32x3`},{shaderLocation:2,offset:24,format:`float32x2`}]},{arrayStride:40,stepMode:`instance`,attributes:b}]},fragment:{module:x,entryPoint:`fs_main`,targets:[{format:o}]},primitive:{topology:`triangle-list`,cullMode:`back`},depthStencil:{depthWriteEnabled:!0,depthCompare:`less`,format:`depth24plus`}}),C=n.createBindGroup({layout:S.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:d},{binding:2,resource:u.createView()}]}),w=n.createShaderModule({code:M}),T=n.createRenderPipeline({layout:`auto`,vertex:{module:w,entryPoint:`vs_main`,buffers:[{arrayStride:12,attributes:[{shaderLocation:0,offset:0,format:`float32x3`}]},{arrayStride:40,stepMode:`instance`,attributes:b}]},fragment:{module:w,entryPoint:`fs_main`,targets:[{format:o,blend:{color:{srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`,operation:`add`},alpha:{srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`,operation:`add`}}}]},primitive:{topology:`line-list`},depthStencil:{depthWriteEnabled:!1,depthCompare:`less`,format:`depth24plus`}}),E=n.createBindGroup({layout:T.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}}]}),D=n.createTexture({size:[e.width,e.height],format:`depth24plus`,usage:GPUTextureUsage.RENDER_ATTACHMENT}),O=new k({title:`太阳系控制台`}),z=O.addFolder(`操作指南`);z.add({fn:()=>{}},`fn`).name(`平移: 鼠标左键拖动`),z.add({fn:()=>{}},`fn`).name(`旋转: 鼠标右键拖动`),z.add({fn:()=>{}},`fn`).name(`缩放: 鼠标滚轮`),z.add({fn:()=>{}},`fn`).name(`重置: 空格键`),z.open();let B=O.addFolder(`控制`);B.add(c,`pauseOrbit`).name(`暂停公转`),B.add(c,`pauseRotation`).name(`暂停自转`),B.add(c,`timeScale`,0,5).name(`时间缩放`),B.add(c,`focusTarget`,P.map(e=>e.name)).name(`聚焦目标`).onChange(e=>{e===`Sun`&&s.reset()});let V=O.addFolder(`模拟模式`);V.add(c,`trueScale`).name(`真实比例模式`),V.add(c,`hideSun`).name(`隐藏太阳`),V.add(c,`brightMode`).name(`明亮模式`),V.add(c,`valSizeScale`,0,5,.1).name(`行星大小缩放`),V.add(c,`valDistScale`,0,2,.001).name(`行星距离缩放`),V.open();let H=t(),U=t(),W=0,G=0,K=Array(P.length).fill(null).map(()=>({x:0,z:0})),q=Array(P.length).fill(null).map(()=>({x:0,z:0}));function J(){let t=.01*c.timeScale;c.pauseOrbit||(W+=t),c.pauseRotation||(G+=t),P.forEach((e,t)=>{let n=(c.trueScale?e.realDistance*N:e.artisticDistance)*c.valDistScale,r=-1*(e.initialAngle+W*e.speed*.1),i=Math.cos(r)*n,a=Math.sin(r)*n;if(e.parentName){let n=P.findIndex(t=>t.name===e.parentName);n===-1?(K[t].x=i,K[t].z=a):(q[t].x=K[n].x,q[t].z=K[n].z,K[t].x=K[n].x+i,K[t].z=K[n].z+a)}else K[t].x=i,K[t].z=a});let o=0,l=0;if(c.focusTarget!==`Sun`){let e=P.findIndex(e=>e.name===c.focusTarget);e!==-1&&(o=K[e].x,l=K[e].z)}P.forEach((e,t)=>{let n=t*10,r=(c.trueScale?e.realRadius*1:e.artisticRadius)*c.valSizeScale;c.hideSun&&e.name===`Sun`&&(r=0);let i=(c.trueScale?e.realDistance*N:e.artisticDistance)*c.valDistScale;_[n+0]=r,_[n+1]=i,_[n+2]=K[t].x,_[n+3]=K[t].z,_[n+4]=e.color[0],_[n+5]=e.color[1],_[n+6]=e.color[2],_[n+7]=e.texIndex,_[n+8]=q[t].x,_[n+9]=q[t].z}),n.queue.writeBuffer(v,0,_),s.updateMatrix();let u=e.width/e.height;i(H,2*Math.PI/5,u,.1,2e6),r(U,H,s.viewMatrix),n.queue.writeBuffer(y,0,U),n.queue.writeBuffer(y,64,new Float32Array([G]));let d=c.brightMode?3:1;n.queue.writeBuffer(y,68,new Float32Array([d])),n.queue.writeBuffer(y,80,new Float32Array([o,0,l]));let b=n.createCommandEncoder(),x=b.beginRenderPass({colorAttachments:[{view:a.getCurrentTexture().createView(),loadOp:`clear`,clearValue:{r:0,g:0,b:0,a:0},storeOp:`store`}],depthStencilAttachment:{view:D.createView(),depthClearValue:1,depthLoadOp:`clear`,depthStoreOp:`store`}});x.setPipeline(S),x.setBindGroup(0,C),x.setVertexBuffer(0,p),x.setVertexBuffer(1,v),x.setIndexBuffer(m,`uint16`),x.drawIndexed(f.indexCount,P.length),x.setPipeline(T),x.setBindGroup(0,E),x.setVertexBuffer(0,g),x.setVertexBuffer(1,v),x.draw(h.length/3,P.length),x.end(),n.queue.submit([b.finish()]),requestAnimationFrame(J)}requestAnimationFrame(J)}z().catch(console.error);