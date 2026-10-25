using Microsoft.Xrm.Sdk;
using System;

namespace Plugins.Warehouse
{
    public interface ILocalPluginContext
    {
        IPluginExecutionContext PluginExecutionContext { get; }
        IOrganizationServiceFactory OrgSvcFactory { get; }
        ITracingService TracingService { get; }
    }

    internal sealed class LocalPluginContext : ILocalPluginContext
    {
        public LocalPluginContext(IPluginExecutionContext executionContext, IOrganizationServiceFactory organizationServiceFactory, ITracingService tracingService)
        {
            PluginExecutionContext = executionContext;
            OrgSvcFactory = organizationServiceFactory;
            TracingService = tracingService;
        }

        public IPluginExecutionContext PluginExecutionContext { get; }
        public IOrganizationServiceFactory OrgSvcFactory { get; }
        public ITracingService TracingService { get; }
    }

    public abstract class PluginBase : IPlugin
    {
        protected PluginBase(Type pluginType)
        {
            if (pluginType == null)
            {
                throw new ArgumentNullException(nameof(pluginType));
            }
        }

        public void Execute(IServiceProvider serviceProvider)
        {
            if (serviceProvider == null)
            {
                throw new ArgumentNullException(nameof(serviceProvider));
            }

            var context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            var organizationServiceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            var tracingService = (ITracingService)serviceProvider.GetService(typeof(ITracingService));

            ExecuteDataversePlugin(new LocalPluginContext(context, organizationServiceFactory, tracingService));
        }

        protected abstract void ExecuteDataversePlugin(ILocalPluginContext localPluginContext);
    }
}
