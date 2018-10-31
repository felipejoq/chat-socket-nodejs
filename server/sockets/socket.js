const { io } = require('../server');

const {crearMensaje } = require('../utilidades/utilidades');
const { Usuarios } = require('../classes/usuarios');
let usuarios = new Usuarios();

io.on('connection', (client) => {
    client.on('entrarChat', (data, callback) =>{
        if(!data.nombre || !data.sala){
            return callback({
                ok: false,
                err: {
                    message: 'El nombre y la sala son necesario'
                }
            });
        }

        let personas = usuarios.agregarPersona(client.id, data.nombre, data.sala);

        client.join(data.sala);

        client.broadcast.to(data.sala).emit('listaPersonas', usuarios.getPersonasPorSala(data.sala));

        client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `¡${ data.nombre} Se unió!`));


        callback(personas);
    });

    client.on('crearMensaje', (data, callback) => {
        let persona = usuarios.getPersona(client.id);

        let mensaje = crearMensaje(persona.nombre, data.mensaje);

        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

        callback(mensaje);

    });

    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `¡${ personaBorrada.nombre} Salió del chat!`));
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala));
    });

    // mensajes privados

    client.on('mensajePrivado', (data) => {
        let persona = usuarios.getPersona(client.id);
        client.broadcast.to(persona.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
    });

});