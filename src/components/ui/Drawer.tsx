import { type ParentComponent, type JSX } from "solid-js";
import styles from './drawer.module.css'

interface DrawerComponentProps {
  id?: string; 
  direction?: 'bottom' | 'right';
  trigger?: JSX.Element;
  title?:JSX.Element;
  content?: JSX.Element;
}

const DrawerComponent: ParentComponent<DrawerComponentProps> = (props) => {
  return (<>

    <button   class="not-prose" attr:popovertarget={props.id}>
      {props.trigger}
    </button>

    <div
      id={props.id}
      class={styles.drawer}
      attr:popover="auto"
      data-dir-rtl={props.direction === 'right' ? '' : undefined}
    >
      <div data-drawer-track class={styles.track}>

        <div data-dismiss-snap class={styles.dismissSnap}>
          <button
            class={`not-prose ${styles.dismissZone}`}
            attr:popovertarget={props.id}
            attr:popovertargetaction="hide"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        <section class={styles.openSnap}>
          <button
            class={`not-prose ${styles.openDismissZone}`}
            attr:popovertarget={props.id}
            attr:popovertargetaction="hide"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div data-drawer-sheet class={`subtle-shadow ${styles.sheet}`}>
            <div class={`glass ${styles.header}`}>
              <div style="grid-column: 2; align-self: center;">{props.title}</div>
              <button
                style="justify-self: end;"
                class={`not-prose ${styles.closeButton}`}
                attr:popovertarget={props.id}
                attr:popovertargetaction="hide"
              >
                <svg style="opacity:20%;
                    width: auto;
                    height: var(--size-md1);
                    padding-inline: var(--size-sm1)" width="24" height="24" fill="none" viewBox="0 0 24 24">
                     <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Zm3.53 6.47-.084-.073a.75.75 0 0 0-.882-.007l-.094.08L12 10.939l-2.47-2.47-.084-.072a.75.75 0 0 0-.882-.007l-.094.08-.073.084a.75.75 0 0 0-.007.882l.08.094L10.939 12l-2.47 2.47-.072.084a.75.75 0 0 0-.007.882l.08.094.084.073a.75.75 0 0 0 .882.007l.094-.08L12 13.061l2.47 2.47.084.072a.75.75 0 0 0 .882.007l.094-.08.073-.084a.75.75 0 0 0 .007-.882l-.08-.094L13.061 12l2.47-2.47.072-.084a.75.75 0 0 0 .007-.882l-.08-.094-.084-.073.084.073Z" fill="oklch(var(--gray-95))"/>
                  </svg>
              </button>
            </div>

            <div class={styles.content}>
              {props.content}
            </div>
          </div>
        </section>

      </div>
    </div>
  </>);
};

export default DrawerComponent;