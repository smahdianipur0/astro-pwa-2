import type { ParentComponent, JSX } from 'solid-js'
import styles from './Swiper.module.css';

const rowActionsGroupName: { name: string } = { name: 'row-actions' };

export interface SwiperComponentProps {
  options: JSX.Element;
}

const SwiperComponent: ParentComponent<SwiperComponentProps> = (props) => {
  return (
    <div class={styles.row}>
      <div class={`HStack ${styles.swipe}`} data-swipe>
        <div class={`HStack ${styles.main}`} data-main>
          {props.children}
        </div>
        <details class={`HStack ${styles.details}`} data-details {...rowActionsGroupName}>
          <summary class={`summary-horizontal trailing not-prose ${styles.summary}`} aria-label="Row actions"> ⋮ </summary>
          <div class={`HStack x-stretch ${styles.reveal}`}>
            <menu style="width: fit-content; margin-inline-start: auto; margin-inline-end: var(--size-xs3);" class="menu-horizontal">
              {props.options}
            </menu>
          </div>
        </details>
      </div>
    </div>
  );
};

export default SwiperComponent;