import { authenticate, configureStoreSearch, defineMiddlewares, validateAndTransformBody } from '@medusajs/framework/http'
import { AtualizarMaterialSchema, ConteudoSchema, CriarMaterialSchema } from './validators'

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    // ensaio: Materioteca e conteúdo do site (painel). Validação do corpo da requisição.
    { method: ['POST'], matcher: '/admin/materiais', middlewares: [validateAndTransformBody(CriarMaterialSchema)] },
    { method: ['POST'], matcher: '/admin/materiais/:id', middlewares: [validateAndTransformBody(AtualizarMaterialSchema)] },
    { method: ['POST'], matcher: '/admin/conteudo', middlewares: [validateAndTransformBody(ConteudoSchema)] },
    // LGPD (ensaio): direitos do titular. Só o próprio cliente autenticado.
    {
      method: ['GET'],
      matcher: '/store/customers/me/exportar',
      middlewares: [authenticate('customer', ['session', 'bearer'])],
    },
    {
      method: ['POST'],
      matcher: '/store/customers/me/excluir',
      middlewares: [authenticate('customer', ['session', 'bearer'])],
    },
  ],
})
