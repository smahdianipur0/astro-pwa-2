import Drawer from "@corvu/drawer";
import type {ParentComponent, JSX } from "solid-js";
import styles from './drawer.module.css'


interface DrawerComponentProps {
  trigger?: JSX.Element;
  title?:JSX.Element;
  content?: JSX.Element;
}

const DrawerComponent: ParentComponent<DrawerComponentProps> = (props) => {
  return (
    <Drawer breakPoints={[0.70]} velocityFunction={() => 1} side="right">
      {(drawerProps) => (
        <>
          <Drawer.Trigger class='not-prose-button'> {props.trigger}</Drawer.Trigger>
          
          <Drawer.Portal>
            <Drawer.Overlay class={styles.overlay}
              style={{
                'background-color': `rgb(0 0 0 / ${
                  0.5 * drawerProps.openPercentage
                })`,
              }}
            />
            <Drawer.Content class={styles.content}>
              <div class='glass' style="display: grid;
                grid-template-columns: 1fr auto 1fr;
                z-index: var(--z-layer-pos-2);              
                background: oklch(var(--gray-10) / 50%);
                border-top-left-radius: var(--radius-a);
                border-top-right-radius: var(--radius-a);
                height: var(--size-lg1);">
              <Drawer.Close> 
                
                <div style="margin-right: var(--size-sm3); display:flex; width: fit-content; align-items: center;">
                    <svg style="padding: 2px" width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.707 4.293a1 1 0 0 1 0 1.414L9.414 12l6.293 6.293a1 1 0 0 1-1.414 1.414l-7-7a1 1 0 0 1 0-1.414l7-7a1 1 0 0 1 1.414 0Z" fill="oklch(var(--primary))"/></svg>
                    <div style="color:oklch(var(--primary));">back</div>
                </div>
                
              </Drawer.Close>  

              <div style="grid-column: 2; align-self: center;">{props.title}</div>
                     
              </div>
              <div class={styles.main}>
                {props.content} 
              </div>
              <Drawer.Description></Drawer.Description>
            </Drawer.Content>
          </Drawer.Portal>
        </>
      )}
    </Drawer>
  )
}

export default DrawerComponent