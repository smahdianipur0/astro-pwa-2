import type { ParentComponent, JSX } from 'solid-js'
import styles from './swiper.module.css';

const rowActionsGroupName: { name: string } = { name: 'row-actions' };

export interface SwiperComponentProps {
  options: JSX.Element;
}


const Swiper: ParentComponent<SwiperComponentProps> = (props) => {
  return (
    <div class={styles.row}>
      <div class={`HStack ${styles.swipe}`} data-swipe>

        <div class={`HStack ${styles.main}`} data-main> {props.children}</div>

        <details class={`HStack details-appear ${styles.details}`} data-details {...rowActionsGroupName}>
          <summary class={`summary-horizontal trailing not-prose ${styles.summary}`} aria-label="Row actions"> ⋮ </summary>
          <menu style="width: fit-content; margin-inline-start: auto; margin-inline-end: var(--size-xs3); animation: none;" class="menu-horizontal">
            {props.options}
          </menu>
        </details>

        <div style="width:5px"></div>
      </div>
    </div>
  );
};

export default Swiper;