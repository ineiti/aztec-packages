pub mod abi_marker_attributes;
pub(crate) mod registry;

use crate::macros::functions::{
    abi_export::create_fn_abi_export,
    utils::{transform_private, transform_public, transform_utility},
};
use registry::{get_private_functions, get_public_functions, get_utility_functions};

pub(crate) comptime fn process_functions(m: Module) -> Quoted {
    let private_functions = get_private_functions(m);
    let public_functions = get_public_functions(m);
    let utility_functions = get_utility_functions(m);

    let transformed_private_functions =
        private_functions.map(|function| transform_private(function)).join(quote {});
    let transformed_public_functions =
        public_functions.map(|function| transform_public(function)).join(quote {});
    let transformed_utility_functions =
        utility_functions.map(|function| transform_utility(function)).join(quote {});

    // Now that we have generated quotes of the new functions based on the original function definitions, we replace
    // the original functions' bodies with `static_assert(false, ...)` to prevent them from being called directly
    // from within the contract. We also need to set the return type to `()` to avoid compilation errors.
    let return_type = quote { () }.as_type();

    private_functions.for_each(|function| {
        let name = function.name();
        let error_message = f"Direct invocation of private functions is not supported. You attempted to call {name}. Please see the documentation for instructions on the proper invocation of private functions: INCLUDE_LINK_HERE";
        let body = quote {
            std::static_assert(false, $error_message);
        };
        let body_expr = body.as_expr().expect(f"Body is not an expression: {body}");
        function.set_body(body_expr);
        function.set_return_type(return_type);
    });
    public_functions.for_each(|function| {
        let name = function.name();
        let error_message = f"Direct invocation of public functions is not supported. You attempted to call {name}. Please see the documentation for instructions on the proper invocation of public functions: INCLUDE_LINK_HERE";
        let body = quote {
            std::static_assert(false, $error_message);
        };
        let body_expr = body.as_expr().expect(f"Body is not an expression: {body}");
        function.set_body(body_expr);
        function.set_return_type(return_type);
    });
    utility_functions.for_each(|function| {
        let name = function.name();
        let error_message = f"Calling utility functions directly from within the contract is not supported. You attempted to call {name}. Please see the documentation for instructions on the proper use of utility functions: INCLUDE_LINK_HERE";
        let body = quote {
            std::static_assert(false, $error_message);
        };
        let body_expr = body.as_expr().expect(f"Body is not an expression: {body}");
        function.set_body(body_expr);
        function.set_return_type(return_type);
    });

    // We return the new functions' quotes to be injected into the contract.
    quote {
        $transformed_private_functions
        $transformed_public_functions
        $transformed_utility_functions
    }
}

pub(crate) comptime fn create_fn_abi_exports(m: Module) -> Quoted {
    let private_functions_exports =
        get_private_functions(m).map(|function| create_fn_abi_export(function)).join(quote {});
    let public_functions_exports =
        get_public_functions(m).map(|function| create_fn_abi_export(function)).join(quote {});
    let utility_functions_exports =
        get_utility_functions(m).map(|function| create_fn_abi_export(function)).join(quote {});

    quote {
        $private_functions_exports
        $public_functions_exports
        $utility_functions_exports
    }
}
