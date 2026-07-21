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
        <div class={`HStack ${styles.main}`}>
          <div class="x-stretch">{props.children}</div>
          
          <details class={`HStack ${styles.details}`} style="font-size: var(--size-sm0);" data-details {...rowActionsGroupName}>
            <summary class={`trailing ${styles.summary}`} aria-label="Row actions">
              ⋮
            </summary>
            <div class={`HStack x-stretch y-stretch ${styles.optionsRow}`}>{props.options}</div>
          </details>
          
        </div>
        <div class={styles.reveal} />
      </div>
    </div>
  );
};

export default SwiperComponent;