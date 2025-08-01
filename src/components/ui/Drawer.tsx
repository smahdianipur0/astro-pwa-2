import { type ParentComponent, type JSX } from "solid-js";
import Drawer from "@corvu/drawer";
import styles from './drawer.module.css'

interface DrawerComponentProps { 
  trigger?: JSX.Element;
  title?:JSX.Element;
  content?: JSX.Element;
}

const DrawerComponent: ParentComponent<DrawerComponentProps> = (props) => {
  return (
    <Drawer breakPoints={[0.70]} velocityFunction={() => 1}>
      {(drawerProps) => (
        <>
          <Drawer.Trigger> {props.trigger}</Drawer.Trigger>

          <Drawer.Portal>
            <Drawer.Overlay class={styles.overlay}
              style={{
                "background-color": `rgb(0 0 0 / ${0.5 * drawerProps.openPercentage})`,
              }}
            />
            <Drawer.Content class={styles.content} >
              <div class='glass' style="display: grid;
                grid-template-columns: 1fr auto 1fr;
                z-index: var(--z-layer-pos-2);              
                background: oklch(var(--gray-10) / 50%);
                border-top-left-radius: var(--radius-a);
                border-top-right-radius: var(--radius-a);
                height: var(--size-lg1);">
                <div style="grid-column: 2; align-self: center;">{props.title}</div>
                <Drawer.Close style="justify-self: end;">
                  <svg style="opacity:20%;
                    width: auto;
                    height: var(--size-sm4);
                    padding-inline: var(--size-sm1)" width="24" height="24" fill="none" viewBox="0 0 24 24">
                     <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm3.53 6.47-.084-.073a.75.75 0 0 0-.882-.007l-.094.08L12 10.939l-2.47-2.47-.084-.072a.75.75 0 0 0-.882-.007l-.094.08-.073.084a.75.75 0 0 0-.007.882l.08.094L10.939 12l-2.47 2.47-.072.084a.75.75 0 0 0-.007.882l.08.094.084.073a.75.75 0 0 0 .882.007l.094-.08L12 13.061l2.47 2.47.084.072a.75.75 0 0 0 .882.007l.094-.08.073-.084a.75.75 0 0 0 .007-.882l-.08-.094L13.061 12l2.47-2.47.072-.084a.75.75 0 0 0 .007-.882l-.08-.094-.084-.073.084.073Z" fill="oklch(var(--gray-95))"/>
                  </svg>
                </Drawer.Close>               
              </div>
              <div class={styles.main}>
              {props.content}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </>
      )}
    </Drawer>
  );
};

export default DrawerComponent;

