import { it, describe, expect } from 'vitest';
import { Service, Ros } from '../';

describe('Service', () => {
  const ros = new Ros({
    url: 'ws://localhost:9090'
  });
  it('Successfully advertises a service with an async return', async () => {
    const server = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_service'
    });
    server.advertiseAsync(async () => {
      return {
        success: true,
        message: 'foo'
      }
    });
    const client = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_service'
    })
    const response = await new Promise((resolve, reject) => client.callService({}, resolve, reject));
    expect(response).toEqual({success: true, message: 'foo'});
    // Make sure un-advertisement actually disposes of the event handler
    expect(ros.listenerCount(server.name)).toEqual(1);
    server.unadvertise();
    expect(ros.listenerCount(server.name)).toEqual(0);
  })
  it('Successfully advertises a service with a synchronous return', async () => {
    const server = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_service'
    });
    server.advertise((request, response) => {
      response.success = true;
      response.message = 'bar';
      return true;
    });
    const client = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_service'
    })
    const response = await new Promise((resolve, reject) => client.callService({}, resolve, reject));
    expect(response).toEqual({success: true, message: 'bar'});
    // Make sure un-advertisement actually disposes of the event handler
    expect(ros.listenerCount(server.name)).toEqual(1);
    server.unadvertise();
    expect(ros.listenerCount(server.name)).toEqual(0);
  })
  
  it('Handles re-advertisement gracefully without throwing errors', async () => {
    const server = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_readvertise'
    });
    
    // First advertisement
    server.advertise((_request, response) => {
      response.success = true;
      response.message = 'first';
      return true;
    });
    
    expect(server.isAdvertised).toBe(true);
    expect(ros.listenerCount(server.name)).toEqual(1);
    
    // Re-advertise with different callback - should not throw
    expect(() => {
      server.advertise((_request, response) => {
        response.success = true;
        response.message = 'second';
        return true;
      });
    }).not.toThrow();
    
    expect(server.isAdvertised).toBe(true);
    expect(ros.listenerCount(server.name)).toEqual(1);
    
    server.unadvertise();
    expect(server.isAdvertised).toBe(false);
    expect(ros.listenerCount(server.name)).toEqual(0);
  })
  
  it('Handles multiple unadvertise calls gracefully', () => {
    const server = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_multiple_unadvertise'
    });
    
    server.advertise((_request, response) => {
      response.success = true;
      return true;
    });
    
    expect(server.isAdvertised).toBe(true);
    
    // First unadvertise
    server.unadvertise();
    expect(server.isAdvertised).toBe(false);
    
    // Second unadvertise - should not throw
    expect(() => {
      server.unadvertise();
    }).not.toThrow();
    
    expect(server.isAdvertised).toBe(false);
  })
  
  it('Handles re-advertisement with advertiseAsync gracefully', async () => {
    const server = new Service({
      ros,
      serviceType: 'std_srvs/Trigger',
      name: '/test_readvertise_async'
    });
    
    // First advertisement
    server.advertiseAsync(async () => {
      return {
        success: true,
        message: 'first'
      }
    });
    
    expect(server.isAdvertised).toBe(true);
    
    // Re-advertise with different callback - should not throw
    expect(() => {
      server.advertiseAsync(async () => {
        return {
          success: true,
          message: 'second'
        }
      });
    }).not.toThrow();
    
    expect(server.isAdvertised).toBe(true);
    
    server.unadvertise();
    expect(server.isAdvertised).toBe(false);
  })
})
