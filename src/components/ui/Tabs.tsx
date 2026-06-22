import type { ParentComponent, JSX } from 'solid-js'
import { customAlphabet } from 'nanoid';
import styles from './tabs.module.css'


const chars = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    6,
);

interface ComponentProps {
    tab1Label:  string,
    tab2Label:  string,
    tab1Value?: string,
    tab2Value?: string,
    tab2?:  JSX.Element;
    tab1?:  JSX.Element;
}


const Tabs: ParentComponent<ComponentProps> = (props) => {

    const name   = `T${chars()}`; 
    const tab1Id = `${name}-1`
    const tab2Id = `${name}-2`

    return (<>

        <div style="display: flex; flex-wrap: wrap; position: relative; justify-content: center;" class={styles.parent}>

            <input type="radio" class={`hide-checkbox ${styles.radio1}`} name={name} id={tab1Id} data-value={props.tab1Value} checked/>
            <input type="radio" class={`hide-checkbox ${styles.radio2}`} name={name} id={tab2Id} data-value={props.tab2Value}/>

            <label class={`no-select ${styles.label} ${styles.label1}`} 
            style=" height: var(--size-md1);
            cursor: pointer;
            width: var(--size-lg3);
            z-index: var(--z-layer-pos-2);
            text-align: center;
            background-color: #0000;
            border: none;
            justify-self: center;
            align-items: center;
            transition: color .2s ease-out;
            display: grid;" 
            for={tab1Id}> {props.tab1Label} </label>

            <label class={`no-select ${styles.label} ${styles.label2}`} 
            style=" height: var(--size-md1);
            cursor: pointer;
            width: var(--size-lg3);
            z-index: var(--z-layer-pos-2);
            text-align: center;
            background-color: #0000;
            border: none;
            justify-self: center;
            align-items: center;
            transition: color .2s ease-out;
            display: grid;" 
            for={tab2Id}> {props.tab2Label} </label>

            <div style=" width: calc((var(--size-lg3) * 2) + 6px);
            display: inline-block;
            align-items: center;
            height: calc(var(--size-md1) + 6px);
            position: absolute;
            top:-3px;
            background-color: oklch(var(--gray-25) / 0.6);
            border-radius: calc( var(--radius-s) + 3px);
            padding: 5px;" ></div>

            <div class={styles.indicator} style="width: var(--size-lg3);
            position: relative;
            display: inline-block;
            justify-content: center;
            align-items: center;
            height: var(--size-md1);
            position: absolute;
            top:0;
            background: var(--tab-indicator-bg) ;
            border-radius: var(--radius-s);
            box-shadow: inset 0.8px 0.8px 0px 0px oklch(var(--rim-light)), 1px 2px 2px 0px oklch(0% 0 0 / 0.1) ;
            transition: transform 250ms var(--move);"> </div> 

            <div class={`${styles.panel} ${styles.panel1}`}> {props.tab1} </div>

            <div class={`${styles.panel} ${styles.panel2}`}> {props.tab2} </div>

        </div>
    </>);
}

export default Tabs