import '../styles/popover.css'
import Popover from '@corvu/popover'
import type { VoidComponent } from 'solid-js'

const VaultMenu: VoidComponent = () => {
  return (
    <Popover
      floatingOptions={{
        offset: 13,
        flip: true,
        shift: true,
      }}
    >
      <Popover.Trigger>
        <div class='text-as-button' style={"margin-right: calc(var(--gap)* -1);"} >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM18 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="oklch(var(--gray-95))"/></svg>
        </div>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content>
          {/*<Popover.Label>Settings</Popover.Label>*/}
          <div class="card-border">
            <div class='card' style={"background-color: oklch(var(--gray-10) / .65);  width:250px;"}>
              <div class='entries-list '>
                <button class='entry-item'>➕ Creat vault</button>
                <button class='entry-item'>📥 Import existing Vault</button>
                <button class='entry-item' style={"color: var(--danger)"} >🗑️ Delete</button>
              </div>
            </div>
          </div>
          <Popover.Arrow />
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  )
}

export default VaultMenu