import { useItemDrawer } from '../../../hooks/useItemDrawer';
import { useAppState } from '../../../store/StoreContext';
import { TaskDrawer } from './TaskDrawer';

/** Mostra o painel da tarefa indicada no endereço (?tarefa=…), em qualquer tela. */
export function TaskDrawerHost() {
  const { tasks } = useAppState();
  const drawer = useItemDrawer('tarefa');
  const task = drawer.openId ? tasks.find((t) => t.id === drawer.openId) : undefined;
  return task ? <TaskDrawer task={task} occurrence={drawer.occurrence} onClose={drawer.close} /> : null;
}
