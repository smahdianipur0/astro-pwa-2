import type { Component } from 'solid-js'
import {icons} from '../../utils/icons'

const Toast: Component = () => {
  return (<>
      <div id="toast" class="top toast glass HStack" 
        style=" margin-top: -100%;
        background-color: oklch(var(--gray-10) / 0.3);
        border-radius: var(--radius-l);
        border: 1px solid  oklch(var(--gray-25) / 1);
        scale: 0.55;
        padding: var(--padding-3);
        transition: bottom 0.25s var(--move), scale 0.5s var(--appear);  
        color: oklch(var(--success));"> 
        <span class="icon" style={{'--icon-url':icons.copied, 'background-color': 'oklch(var(--success))'}}></span>
        <div class="VStack leading" style="--gap:0;">
          <span>Copied</span>
          <small id="clipboard" class="prose ellipsis" style="max-width: var(--size-xl2); line-height: var(--size-sm3);"></small>
        </div>
      </div>
  </>);
}

export default Toast