import type { ParentComponent, JSX } from 'solid-js'
import styles from './popover.module.css'
import { customAlphabet } from 'nanoid';


const chars = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    6,
);



interface ComponentProps {
    trigger?: JSX.Element;
}

const Popover: ParentComponent<ComponentProps> = (props) => {

    const id         = `P${chars()}`;
    const anchorName = `--${id}`; 

    return (<>

        <button popovertarget={id} 
            style={`anchor-name: ${anchorName}; cursor: pointer;`}
            class="not-prose">
            {props.trigger}
        </button>


        <div class={`prose subtle-shadow ${styles.popover}`} 
            id={id} popover="auto" 
            style={`position-anchor: ${anchorName}`}>
            {props.children}
        </div>
  </>);
}

export default Popover