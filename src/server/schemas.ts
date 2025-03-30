import { z } from "zod";

export const registrationInputSchema = z.object({ 
    challenge: z.string(),
    registry : z.object({
        type: z.literal('public-key'),
        id: z.string(), 
        rawId: z.string(), 
        authenticatorAttachment: z.enum(['cross-platform', 'platform']),
        clientExtensionResults: z.object({}).default({}),
        response: z.object({
            attestationObject: z.string(), 
            authenticatorData: z.string(), 
            clientDataJSON: z.string(), 
            publicKey: z.string(),
            publicKeyAlgorithm: z.number().int(),
            transports: z.array(z.enum(['hybrid', 'internal', 'usb', 'nfc', 'ble'])).default(['hybrid', 'internal'])
        }),
        user: z.object({
            name: z.string(),
            id: z.string().uuid()
        })
    })
});

export const authenticationInputSchema = z.object({  
    challenge: z.string(),  
    authenticationData: z.object({
        clientExtensionResults: z.record(z.string(), z.any()),
        id: z.string(),
        rawId: z.string(),
        type: z.literal('public-key'),
        authenticatorAttachment: z.enum(['cross-platform', 'platform']),
        response: z.object({
          authenticatorData: z.string(),
          clientDataJSON: z.string(),
          signature: z.string(),
          userHandle: z.string(),
        }),
    })
});

export const credentialSchema = z.object({
    credentials: z.object({
        algorithm: z.literal("ES256"),
        id: z.string(),
        publicKey: z.string(),
        transports: z.tuple([z.literal('internal')])
    })
});

export const UID = z.object({UID:z.string()});


export const VaultsArraySchema = z.object({
    id: z.string().optional(),
    name: z.string(),
    role: z.string().optional(),
    status: z.enum(["deleted", "available"]).optional(),
    updatedAt: z.string().datetime(),
  });

export const syncVaultsSchema = z.object({
    challenge: z.string(),  
    authenticationData: z.object({
        clientExtensionResults: z.record(z.string(), z.any()),
        id: z.string(),
        rawId: z.string(),
        type: z.literal('public-key'),
        authenticatorAttachment: z.enum(['cross-platform', 'platform']),
        response: z.object({
          authenticatorData: z.string(),
          clientDataJSON: z.string(),
          signature: z.string(),
          userHandle: z.string(),
        }),
    }),
    vaults: z.array(VaultsArraySchema)    
})
